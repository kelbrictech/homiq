import type {CSSProperties} from 'react';
import {visualAssets} from './visualAssets';
type AssetKey=keyof typeof visualAssets.categories;
export function CategoryAsset({category,fallback}:{category:AssetKey;fallback:string}){
  const src=visualAssets.categories[category];
  return <span className="asset-frame asset-frame--category" aria-hidden="true">
    {src?<img src={src} alt="" loading="lazy" decoding="async"/>:<span className="asset-placeholder">{fallback}</span>}
  </span>;
}
export function BrandAsset(){
  const src=visualAssets.brand.logo;
  return src?<img className="brand-logo" src={src} alt="HOMIQ"/>:<span className="brand">homiq<span>.</span></span>;
}
export function VisualFrame({src,label,ratio='16 / 9'}:{src:string|null;label:string;ratio?:string}){
  return <div className="asset-frame asset-frame--generic" style={{'--asset-ratio':ratio} as CSSProperties}>
    {src?<img src={src} alt={label} loading="lazy"/>:<span className="asset-placeholder">{label} · artwork pending</span>}
  </div>;
}
