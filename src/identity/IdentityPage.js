import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateIdentities } from './IdentityUtils';
import PageToolbar from '../components/PageToolbar';
import { FaRegCopy, FaCheck, FaDownload, FaChevronRight, FaInfoCircle } from "react-icons/fa";
import { cn } from '../components/utils';
import { avatarProviders } from './AvatarUtils';
import ToolbarStorage from '../components/storage';

const IdentityCard = ({ identity, onCopy, copiedField }) => {
  const { name, phone, address, avatar, gradient, id, birthday, username, disposableEmail } = identity;
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState(null); // 'downloading' | 'success' | null
  const imgRef = useRef(null);

  // Create a proxy URL for images that don't support CORS
  const getProxyUrl = (url) => {
    if (url.includes('dicebear')) return url; // dicebear supports CORS reliably
    if (url.includes('avataaars.io')) {
      // For avataaars.io, use raw.githubusercontent.com proxy which handles SVGs better
      return `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    }
    // Use weserv for other images
    return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
  };

  const handleImageDownload = async (e) => {
    e.stopPropagation();
    try {
      console.log('Setting status to downloading');
      setDownloadStatus('downloading');
      const fileName = `${name.firstName.toLowerCase()}-${name.lastName.toLowerCase()}-${avatar.type}`;
      
      // Create a temporary image to load the proxied URL for download
      const tempImg = new Image();
      const proxiedUrl = getProxyUrl(avatar.url);
      
      tempImg.crossOrigin = 'anonymous';  // Enable this since we're using the proxy
      tempImg.src = proxiedUrl;
      
      await new Promise((resolve, reject) => {
        tempImg.onload = resolve;
        tempImg.onerror = reject;
      });
      
      // Create a canvas element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas size to match image
      canvas.width = tempImg.naturalWidth;
      canvas.height = tempImg.naturalHeight;
      
      // Draw image onto canvas
      ctx.drawImage(tempImg, 0, 0);
      
      // For SVG (dicebear) or transparent avatars, ensure white background
      if (avatar.url.includes('dicebear') || avatar.url.includes('avataaars.io')) {
        // Save current state
        ctx.save();
        // Draw white background
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Restore state
        ctx.restore();
      }
      
      // Convert to blob and download
      canvas.toBlob((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        console.log('Setting status to success');
        setDownloadStatus('success');
        
        // Reset status after 2 seconds - now with no transition
        setTimeout(() => {
          setDownloadStatus(null);
        }, 2000);
      }, 'image/png');
      
    } catch (error) {
      console.error('Error downloading image:', error);
      console.log('Error occurred, setting status to null');
      setDownloadStatus(null);
    }
  };

  // Create a reusable copy button component
  const CopyButton = ({ text, type, white = false, className = "", icon = <FaRegCopy />, size = "small", tooltip = null, tooltipPosition = "bottom" }) => {
    const iconSize = size === "small" ? "w-3.5 h-3.5" : "w-5 h-5";
    
    return (
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onCopy(text, type, id);
        }}
        className={cn(
          `p-1 rounded-full transition-colors flex items-center justify-center relative group`,
          size === "small" ? "" : "p-2",
          white ? 'hover:bg-white/20' : 'hover:bg-gray-100',
          className
        )}
        title={tooltip ? undefined : "Copy to clipboard"}
      >
        {copiedField === type ? (
          <FaCheck className={`${iconSize} ${white ? 'text-white' : 'text-green-600'}`} />
        ) : (
          React.cloneElement(icon, { className: `${iconSize} ${white ? 'text-white/70' : 'text-gray-500'}` })
        )}
        
        {tooltip && (
          <div className={cn(
            "absolute px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10",
            tooltipPosition === "right" && "left-full ml-2 top-1/2 -translate-y-1/2",
            tooltipPosition === "bottom" && "top-full mt-2 left-1/2 -translate-x-1/2",
            tooltipPosition === "left" && "right-full mr-2 top-1/2 -translate-y-1/2",
            tooltipPosition === "top" && "bottom-full mb-2 left-1/2 -translate-x-1/2"
          )}>
            {tooltip}
          </div>
        )}
      </button>
    );
  };

  const InfoTooltip = ({ text, className = "" }) => (
    <div className={cn("relative inline-block ml-2 group", className)}>
      <FaInfoCircle className="w-3 h-3 text-gray-400 hover:text-gray-600 transition-colors" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-[11px] leading-normal rounded 
        opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48 text-center break-words">
        {text}
      </div>
    </div>
  );

  const InfoRow = ({ 
    content, 
    type, 
    className = "", 
    isName = false, 
    white = false, 
    label = "",
    children = null,
    isChild = false 
  }) => {
    return (
      <>
        <div 
          onClick={() => onCopy(content, type, id)}
          className={cn(
            'flex items-center py-1.5 px-2 cursor-pointer rounded -mx-2 group/row relative',
            !white && 'hover:bg-gray-50',
            isName ? 'justify-start' : 'justify-between',
            className
          )}
        >
          <span className={`${isName ? 'text-2xl font-semibold' : 'text-sm'} ${white ? 'text-white' : 'text-gray-700'} relative group/value`}>
            {content}
            {!isName && label && (
              <div className="absolute top-1/2 left-full -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded 
                opacity-0 group-hover/value:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {label}
              </div>
            )}
          </span>
          <CopyButton className={isName ? "!ml-2" : "!ml-4"} text={content} type={type} white={white} />
        </div>
        {children}
      </>
    );
  };

  // Function to format all identity data for copying
  const formatIdentityForCopy = () => {
    return `Name: ${name.full}
Email: ${name.email}
Disposable Email: ${disposableEmail.email}
Disposable Email Inbox: ${disposableEmail.inboxUrl}
Username: ${username}
Phone: ${phone}
Address: ${address.full}
Birthday: ${birthday}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Banner and Avatar Section */}
      <div>
        <div className={`h-12 md:h-20 lg:h-24 ${gradient[1]} ${gradient[0]} relative`}>
          {/* Copy All Button */}
          <div className="absolute top-2 left-2 md:left-4 md:top-4">
            <CopyButton 
              text={formatIdentityForCopy()} 
              type="fullIdentity" 
              white={true} 
              size="large"
              icon={<FaRegCopy />}
              className="bg-white/10 backdrop-blur-sm"
              tooltip="Copy identity to clipboard"
              tooltipPosition="right"
            />
          </div>
        </div>
        <div className="px-6 -mt-8 md:-mt-12 lg:-mt-14 flex justify-between items-start">
          <div className="flex-1 pr-4 mt-16 md:mt-16 lg:mt-20">
            <InfoRow content={name.full} type="name" className="!p-0 !-mx-0" isName={true} />
          </div>
          <div className="relative group">
            <div className={cn(
              "w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full border-4 border-white shadow-lg flex-shrink-0",
              "relative overflow-hidden",
              !imageLoaded && "animate-pulse bg-gray-200"
            )}>
              {/* Skeleton loader */}
              {!imageLoaded && !imageError && (
                <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-gray-300" />
                </div>
              )}
              
              {/* Actual image */}
              <img 
                ref={imgRef}
                src={avatar.url}
                alt={name.full}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  setImageError(true);
                  setImageLoaded(true);
                }}
                className={cn(
                  "w-full h-full object-cover transition-all duration-500 bg-white",
                  typeof avatar === 'string' && avatar.includes('dicebear') && "bg-white p-1",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
              />
              
              {/* Error fallback */}
              {imageError && (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                  <span className="text-4xl">👤</span>
                </div>
              )}
            </div>
            
            {/* Download overlay with status */}
            <div 
              onClick={handleImageDownload}
              className={cn(
                "absolute inset-0 flex items-center justify-center rounded-full",
                downloadStatus ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                downloadStatus === 'success' ? "bg-green-500/50" : "bg-black/50",
                // Remove transition for instant disappearance when status changes to null
                downloadStatus === null ? "" : "transition-all duration-300"
              )}
            >
              {downloadStatus === 'downloading' ? (
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
              ) : downloadStatus === 'success' ? (
                <FaCheck className="w-8 h-8 text-white" />
              ) : !downloadStatus && (
                <FaDownload className="w-8 h-8 text-white" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="px-6 pb-5 overflow-visible">
        {/* Info Section */}
        <div className="mt-2 overflow-visible">
          <InfoRow content={name.email} type="email" label="Fake Email" />
          <InfoRow 
            content={disposableEmail.email} 
            type="disposableEmail" 
            label="Disposable Email"
          >

            <div className="flex items-center">
              <a 
                href={disposableEmail.inboxUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-6 py-1 px-2 -mx-2 flex items-center text-[12px] text-gray-500 hover:text-blue-600 transition-colors relative group"
              >
                <FaChevronRight className="absolute -left-4 top-1/2 -translate-y-1/2 w-2 h-2 text-gray-400" />
                <span>View Mailbox on {disposableEmail.label}</span>
              </a>
              <InfoTooltip text={"This is a temporary inbox where you can receive emails. The inbox is public and emails are automatically deleted after 1-3 days depending on the provider."} />
            </div>
          </InfoRow>
          <InfoRow content={username} type="username" label="Username" className="text-gray-500" />
          <InfoRow content={phone} type="phone" label="Phone" />
          <InfoRow content={address.full} type="address" label="Address" />
          <InfoRow content={birthday} type="birthday" label="Birthday" />
        </div>
      </div>
    </div>
  );
};

const IdentityDisplay = () => {
  const [identities, setIdentities] = useState([]);
  const [copiedStates, setCopiedStates] = useState({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [genderPreference, setGenderPreference] = useState(() => {
    return ToolbarStorage.getGenderPreference(null);
  });
  const [enabledProviders, setEnabledProviders] = useState(() => {
    const defaultProviders = {
      realistic: true,
      avataaars: true,
      randomuser: true,
      identicon: true,
      personas: true,
      avataaarsNeutral: true,
      uiAvatars: true,
      shapes: true
    };
    return ToolbarStorage.getAvatarProviders(defaultProviders);
  });

  const dropdownRef = useRef(null);

  // Sample identity for previews
  const sampleIdentity = {
    sex: 'male',
    full: 'John Smith'
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const generateNewIdentities = useCallback(() => {
    const NUM_IDENTITIES = 4;
    const newIdentities = generateIdentities(NUM_IDENTITIES, enabledProviders, genderPreference);
    setIdentities(newIdentities);
    setCopiedStates({});
  }, [enabledProviders, genderPreference]);

  const copyToClipboard = useCallback((text, type, cardId) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({
      ...prev,
      [cardId]: type
    }));
    setTimeout(() => {
      setCopiedStates(prev => ({
        ...prev,
        [cardId]: null
      }));
    }, 2000);
  }, []);

  useEffect(() => {
    generateNewIdentities();
  }, [generateNewIdentities]);

  const handleProviderToggle = (provider) => {
    setEnabledProviders(prev => {
      // Don't allow disabling all providers
      const wouldAllBeDisabled = Object.entries(prev)
        .filter(([key]) => key !== provider)
        .every(([_, enabled]) => !enabled) && prev[provider];
      
      if (wouldAllBeDisabled) return prev;
      
      const newProviders = {
        ...prev,
        [provider]: !prev[provider]
      };
      
      // Save to local storage
      ToolbarStorage.setAvatarProviders(newProviders);
      return newProviders;
    });
  };

  return (
    <section className="content overflow-visible">
      <PageToolbar
        onGenerate={generateNewIdentities}
        generateButtonText="More"
        className="items-center"
      >
        <div className="flex items-center gap-4">
          <select
            value={genderPreference || ''}
            onChange={(e) => {
              const value = e.target.value || null;
              setGenderPreference(value);
              ToolbarStorage.setGenderPreference(value);
            }}
            className="select select-bordered select-sm w-[150px]"
          >
            <option value="" disabled>Pick Gender</option>
            <option value="">Random</option>
            <option value="male">Man</option>
            <option value="female">Woman</option>
          </select>

          <div className="relative" ref={dropdownRef}>
            <div className="dropdown">
              <div tabIndex={0} role="button" className="btn btn-sm">
                Avatar Types
              </div>
              <div tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-[280px]">
                {Object.entries(avatarProviders).map(([key, provider]) => (
                  <label key={key} className="flex items-center gap-3 px-3 py-2 hover:bg-base-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enabledProviders[key]}
                      onChange={() => handleProviderToggle(key)}
                      className="checkbox checkbox-sm"
                    />
                    <img 
                      src={provider.generate(sampleIdentity)}
                      alt={provider.label}
                      className="w-8 h-8 rounded-full bg-white object-cover"
                    />
                    <span className="text-sm">{provider.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PageToolbar>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 overflow-visible">
        {identities.map((identity) => (
          <IdentityCard
            key={identity.id}
            identity={identity}
            onCopy={copyToClipboard}
            copiedField={copiedStates[identity.id]}
          />
        ))}
      </div>
    </section>
  );
};

const IdentityPage = () => {
  const avatarServices = [
    { name: 'RandomUser.me', url: 'https://randomuser.me' },
    { name: 'Avataaars', url: 'https://avataaars.io' },
    { name: 'DiceBear', url: 'https://www.dicebear.com' },
    { name: 'UI Avatars', url: 'https://ui-avatars.com' },
    { name: 'XSGames', url: 'https://xsgames.co/randomusers' }
  ];

  const ExternalLink = ({ href, children }) => (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="text-gray-600 hover:underline"
    >
      {children}
    </a>
  );

  return (
    <div className="container mx-auto p-4 overflow-visible">
      <h2 className="page-title">Identity Generator</h2>
      <IdentityDisplay />
      <div className="mt-16 text-center text-sm text-gray-400 space-y-2">
        <p>
          Data powered by{' '}
          <ExternalLink href="https://fakerjs.dev">Faker.js</ExternalLink>.{' '}
          Avatars provided by{' '}
          {avatarServices.map((service, i) => (
            <>
              <ExternalLink key={service.url} href={service.url}>
                {service.name}
              </ExternalLink>
              {i < avatarServices.length - 1 && (
                i === avatarServices.length - 2 ? ' and ' : ', '
              )}
            </>
          ))}.{' '}
          Disposable email services by{' '}
          <ExternalLink href="https://maildrop.cc">Maildrop.cc</ExternalLink>,{' '}
          <ExternalLink href="https://reusable.email">reusable.email</ExternalLink>, and{' '}
          <ExternalLink href="https://inboxkitten.com">Inbox Kitten</ExternalLink>.{'   '}
          Usernames are generated using our{' '}
          <a href="/username" className="text-gray-600 hover:underline">
            Username Generator
          </a>.
        </p>
      </div>
    </div>
  );
};

export default IdentityPage; 