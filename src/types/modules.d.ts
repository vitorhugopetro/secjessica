/* eslint-disable @typescript-eslint/no-explicit-any */

declare module "next" {
  export type Metadata = any;
  export type Viewport = any;
  export type NextConfig = any;
  export namespace MetadataRoute {
    export type Sitemap = any[];
    export type Robots = any;
  }
  const next: any;
  export default next;
}

declare module "next/types.js" {
  export type NextConfig = any;
  export type Metadata = any;
  export type ResolvingMetadata = any;
  export type ResolvingViewport = any;
}

declare module "next/server.js" {
  export class NextResponse {
    static next(init?: any): any;
    static redirect(url: string | URL, init?: any): any;
    static json(body: any, init?: any): any;
  }
  export type NextRequest = any;
}

declare module "next/headers" {
  export function cookies(): Promise<any>;
  export function headers(): Promise<any>;
}

declare module "next/server" {
  export class NextResponse {
    static next(init?: any): any;
    static redirect(url: string | URL, init?: any): any;
    static json(body: any, init?: any): any;
  }
  export type NextRequest = any;
  export type NextFetchEvent = any;
  export type NextMiddleware = any;
}

declare module "next/cache" {
  export function revalidatePath(path: string, type?: "page" | "layout"): void;
  export function revalidateTag(tag: string): void;
}

declare module "next/link" {
  import React from "react";
  const Link: React.FC<any>;
  export default Link;
}

declare module "next/navigation" {
  export function useRouter(): any;
  export function usePathname(): string;
  export function useSearchParams(): any;
  export function redirect(url: string): never;
  export function notFound(): never;
}

declare module "next/font/google" {
  export function Inter(options?: any): { className: string; variable: string };
  export function Playfair_Display(options?: any): { className: string; variable: string };
  export function Plus_Jakarta_Sans(options?: any): { className: string; variable: string };
}

declare module "*.css";
