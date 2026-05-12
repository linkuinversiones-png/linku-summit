'use client';

import Image from 'next/image';
import { useState } from 'react';

type Props = {
  name: string;
  logo: string;
};

export default function PartnerLogo({ name, logo }: Props) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex h-16 w-full items-center justify-center px-4 opacity-70 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0 sm:h-20">
      {failed ? (
        <span className="text-xs font-medium uppercase tracking-wider text-linku-text-muted">
          {name}
        </span>
      ) : (
        <Image
          src={logo}
          alt={name}
          width={140}
          height={48}
          className="max-h-full w-auto object-contain"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
