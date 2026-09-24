import Link from 'next/link';
import {Wrench,ArrowRight} from 'lucide-react';
import {rupiah} from '@/lib/money';

type ServiceCardService={id:string;name:string;basePrice:number;slug:string;imageUrl?:string|null;pricingType?:string;unit?:string|null;category:{slug:string}};
export function ServiceCard({s}:{s:ServiceCardService}){
  const price=s.pricingType==='CUSTOM_QUOTE'?'Minta penawaran':`${s.pricingType==='STARTING_FROM'?'Mulai ':''}${rupiah(s.basePrice)}${s.unit?`/${s.unit}`:''}`;
  return <article className="service-v6-card">
    <Link href={`/jasa/${s.category.slug}/${s.slug}`} className="service-v6-photo" aria-label={`Lihat ${s.name}`}>
      {s.imageUrl?<img src={s.imageUrl} alt={s.name} loading="lazy"/>:<span><Wrench size={38}/></span>}
    </Link>
    <div className="service-v6-body"><h3>{s.name}</h3><strong>{price}</strong><Link className="service-v6-order" href={`/checkout?service=${encodeURIComponent(s.id)}`}>Pesan Sekarang <ArrowRight size={15}/></Link></div>
  </article>
}
