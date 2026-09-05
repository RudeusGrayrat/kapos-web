function getPublicValue(value: string | undefined) {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : null;
}

// These values are intentionally public: they are rendered in the landing footer.
export const publicSite = {
  contact: {
    email: getPublicValue(process.env.NEXT_PUBLIC_KAPOS_EMAIL),
    phone: getPublicValue(process.env.NEXT_PUBLIC_KAPOS_PHONE),
    whatsappUrl: getPublicValue(process.env.NEXT_PUBLIC_KAPOS_WHATSAPP_URL),
    address: getPublicValue(process.env.NEXT_PUBLIC_KAPOS_ADDRESS),
    mapsUrl: getPublicValue(process.env.NEXT_PUBLIC_KAPOS_MAPS_URL),
  },
  social: {
    instagramUrl: getPublicValue(process.env.NEXT_PUBLIC_KAPOS_INSTAGRAM_URL),
    facebookUrl: getPublicValue(process.env.NEXT_PUBLIC_KAPOS_FACEBOOK_URL),
    tiktokUrl: getPublicValue(process.env.NEXT_PUBLIC_KAPOS_TIKTOK_URL),
    linkedinUrl: getPublicValue(process.env.NEXT_PUBLIC_KAPOS_LINKEDIN_URL),
  },
};
