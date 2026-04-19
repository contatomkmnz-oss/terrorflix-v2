import React, { useState } from 'react';
import { PROFILE_AVATAR_FALLBACK } from '@/data/profileAvatars';
import { publicAssetUrl } from '@/lib/publicAssetUrl';

/**
 * Avatar com object-cover, fallback se a URL falhar (sem quebrar layout).
 */
export default function ProfileAvatarImage({
  src,
  alt = '',
  className = '',
  loading = 'lazy',
  decoding = 'async',
}) {
  const [failed, setFailed] = useState(false);
  const effective = failed || !src ? PROFILE_AVATAR_FALLBACK : publicAssetUrl(src);

  return (
    <img
      src={effective}
      alt={alt}
      loading={loading}
      decoding={decoding}
      className={className}
      onError={() => {
        if (!failed) setFailed(true);
      }}
    />
  );
}
