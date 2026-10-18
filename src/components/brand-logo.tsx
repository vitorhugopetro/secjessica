"use client";

import React, { useState } from "react";
import Link from "next/link";

interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  href?: string;
}

export function BrandLogo({
  className = "",
  size = "md",
  showText = true,
  href = "/",
}: BrandLogoProps) {
  const [imgSrc, setImgSrc] = useState<string>("/assets/logos/logo_transparente.png");

  const heightClasses = {
    sm: "h-8",
    md: "h-10",
    lg: "h-12",
  };

  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={imgSrc}
        alt="Jéssica Secretaria Remota"
        className={`${heightClasses[size]} w-auto object-contain transition-transform duration-200 hover:scale-[1.02]`}
        onError={() => {
          if (imgSrc !== "/assets/logos/logo_transparente.png") {
            setImgSrc("/assets/logos/logo_transparente.png");
          }
        }}
      />
      {showText && (
        <div className="hidden sm:flex flex-col">
          <span className="font-playfair font-bold text-secjessica-900 tracking-tight text-xl leading-none">
            SecJessica
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mt-0.5">
            Secretariado Remoto
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center focus:outline-hidden">
        {content}
      </Link>
    );
  }

  return content;
}
