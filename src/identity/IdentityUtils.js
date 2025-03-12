import { faker } from '@faker-js/faker';
import { generateUsername, usernameTypes } from '../username/username-generator';
import { generateAvatar } from './AvatarUtils';

const gradientPairs = [
  ['from-blue-500 to-purple-500', 'bg-gradient-to-r'],
  ['from-green-400 to-cyan-500', 'bg-gradient-to-r'],
  ['from-pink-500 to-rose-500', 'bg-gradient-to-r'],
  ['from-amber-500 to-pink-500', 'bg-gradient-to-r'],
  ['from-violet-500 to-purple-500', 'bg-gradient-to-r'],
  ['from-cyan-500 to-blue-500', 'bg-gradient-to-r'],
  ['from-emerald-500 to-teal-500', 'bg-gradient-to-r'],
  ['from-fuchsia-500 to-pink-500', 'bg-gradient-to-r'],
  ['from-indigo-500 to-purple-500', 'bg-gradient-to-br'],
  ['from-orange-500 to-rose-500', 'bg-gradient-to-r'],
];

const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];

const generateName = (sex = null) => {
  if (!sex) {
    sex = faker.person.sex();
  }
  const firstName = faker.person.firstName(sex);
  const lastName = faker.person.lastName(sex);
  return {
    firstName,
    lastName,
    full: `${firstName} ${lastName}`,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    sex
  };
};

const generatePhoneNumber = () => {
  return faker.phone.number({ style: 'national' });
};

const generateAddress = () => {
  const street = faker.location.streetAddress();
  const city = faker.location.city();
  const state = faker.location.state({ abbreviated: true });
  const zip = faker.location.zipCode('#####');
  
  return {
    street,
    city,
    state,
    zip,
    full: `${street}, ${city}, ${state} ${zip}`
  };
};

const generateBirthday = () => {
  return faker.date.birthdate({ 
    min: 18, 
    max: 70, 
    mode: 'age' 
  }).toLocaleDateString('en-US', { 
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

const generateGradient = () => {
  return getRandomElement(gradientPairs);
};

const disposableEmailProviders = {
  maildrop: {
    label: 'Maildrop.cc',
    domains: ['maildrop.cc'],
    getInboxUrl: (username) => `https://maildrop.cc/inbox/?mailbox=${username}`,
  },
  reusable: {
    label: 'Reusable.email',
    domains: ['reusable.email'],
    getInboxUrl: (username) => `https://reusable.email/${username}`,
  },
  inboxkitten: {
    label: 'InboxKitten.com',
    domains: ['inboxkitten.com'],
    getInboxUrl: (username) => `https://inboxkitten.com/inbox/${username}/list`,
  }
};

const generateDisposableEmail = () => {
  // Pick a random provider
  const providerKey = getRandomElement(Object.keys(disposableEmailProviders));
  const provider = disposableEmailProviders[providerKey];
  
  // Generate username using random bit type
  const randomUsernameType = getRandomElement(usernameTypes);
  const username = generateUsername(randomUsernameType).username;
  
  // Pick a random domain from the provider
  const domain = getRandomElement(provider.domains);
  
  const email = `${username}@${domain}`;
  const inboxUrl = provider.getInboxUrl(username);
  
  return {
    email,
    username,
    domain,
    provider: providerKey,
    label: provider.label,
    inboxUrl
  };
};

export const generateIdentity = (enabledProviders = null, sex = null) => {
  // Seed faker with a random value for each identity generation
  faker.seed(Math.random() * 10000000);

  const name = generateName(sex);
  const phone = generatePhoneNumber();
  const address = generateAddress();
  const avatar = generateAvatar(name, null, enabledProviders);
  const gradient = generateGradient();
  const birthday = generateBirthday();
  const disposable = generateDisposableEmail();

  return {
    name,
    phone,
    address,
    avatar: {
      url: avatar.url,
      type: avatar.type,
      label: avatar.label
    },
    gradient,
    birthday,
    username: disposable.username,
    disposableEmail: disposable,
    id: faker.string.uuid(),
    sex: name.sex
  };
};

export const generateIdentities = (count = 4, enabledProviders = null, sex = null) => {
  return Array(count).fill().map(() => generateIdentity(enabledProviders, sex));
}; 