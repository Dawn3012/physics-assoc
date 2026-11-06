import { FC } from 'react';
import { FaFacebook, FaLinkedin, FaInstagram, FaYoutube } from 'react-icons/fa';

export const socialLinks = [
  {
    name: 'YouTube',
    url: 'https://www.youtube.com/@bitsphysicsassoc',
    icon: FaYoutube,
  },
    {
    name: 'Instagram',
    url: 'hhttps://www.instagram.com/physicsassociation_bitspilani/',
    icon: FaInstagram,
  },
  // {
  //   name: 'Facebook',
  //   url: 'https://www.facebook.com/Physics.Association.BITSPilani/',
  //   icon: FaFacebook,
  // },
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/company/physicsassociationbitspilani',
    icon: FaLinkedin,
  },
];

export const navigationLinks = [
  { label: 'Home', href: '/' },
  { label: 'Events', href: '/events' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Blog', href: '/blog' },
  { label: 'Newsletter', href: '/newsletter' },
  // { label: 'Short Posts', href: 'https://www.instagram.com/bits_phyassoc/' },
  { label: 'About Us', href: '/about' },
];

export const quotes = [
  {
    text: 'God does not play dice',
    author: 'Albert Einstein',
  },
  {
    text: "Don't tell me what to do",
    author: 'God',
  },
  {
    text: 'If you want to master something, teach it!',
    author: 'Richard Feynman',
  },
];

export const aboutContent = {
  title: 'About Us',
  description:
    'We are a bunch of nerds trying to promote the beautiful language of physics in all of its true glory. We have a swanky team of students from BITS Pilani, Pilani Campus. We provide quality content through our blog and engaging Instagram posts explaining cool physics phenomena. Be sure to check all of these and follow all of our socials for the latest updates on our work!',
  image:
    'https://raw.githubusercontent.com/bitsphyassoc/bitsphyassoc.github.io/main/assets/images/feature-image.jpg',
};
