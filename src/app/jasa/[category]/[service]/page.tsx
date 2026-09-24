import type {Metadata} from 'next';
import {db} from '@/lib/db';
import {Header} from '@/components/Header';
import {rupiah} from '@/lib/money';
import Link from 'next/link';
import {notFound} from 'next/navigation';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{category:string;service:string}>}):Promise<Metadata>{
  const {category,service}=await params;const s=await db.service.findFirst({where:{slug:service,active:true,archivedAt:null,category:{slug:category,active:true,archivedAt:null}},select:{name:true,seoTitle:true,seoDescription:true,description:true,imageUrl:true}});
  if(!s)return {title:'Layanan tidak ditemukan',robots:{index:false,follow:false}};
  const title=s.seoTitle||`${s.name} di Batam — Pesan Jasa`;const description=s.seoDescription||s.description||`Pesan ${s.name} di Batam dengan jadwal fleksibel dan informasi harga yang transparan.`;
  return {title,description,alternates:{canonical:`/jasa/${category}/${service}`},openGraph:{title,description,url:`/jasa/${category}/${service}`,images:s.imageUrl?[{url:s.imageUrl,alt:s.name}]:undefined}};
}
export default async function Page({params}:{params:Promise<{category:string;service:string}>}){
  const {category,service}=await params;
  const s=await db.service.findFirst({where:{slug:service,active:true,archivedAt:null,category:{slug:category,active:true,archivedAt:null}},include:{category:true,variants:{where:{active:true},orderBy:{sortOrder:'asc'}},addons:{where:{active:true},orderBy:{sortOrder:'asc'}},serviceAreas:{where:{active:true},include:{area:true}}}});
  if(!s)notFound();const base=process.env.NEXT_PUBLIC_APP_URL||'https://jasabatam.com';const schema={'@context':'https://schema.org','@type':'Service',name:s.name,description:s.seoDescription||s.description||undefined,url:`${base}/jasa/${s.category.slug}/${s.slug}`,areaServed:s.serviceAreas.map(x=>({'@type':'AdministrativeArea',name:x.area.name})),offers:s.pricingType==='CUSTOM_QUOTE'?undefined:{'@type':'Offer',priceCurrency:'IDR',price:s.basePrice,availability:'https://schema.org/InStock'}};
  return <><Header/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\\u003c')}}/><main className="container section"><p className="muted">Jasa / {s.category.name} / {s.name}</p><div className="public-detail-grid"><article className="card public-detail-card"><h1>{s.name}</h1><p>{s.fullDescription||s.description||`Pesan ${s.name} di Batam dengan jadwal yang fleksibel.`}</p><h3>Harga mulai {rupiah(s.basePrice)}</h3><p>Estimasi durasi ± {s.estimatedMinutes} menit.</p>{s.variants.length>0&&<><h3>Varian</h3>{s.variants.map(v=><p key={v.id}>{v.name} · +{rupiah(v.priceDelta)}</p>)}</>}{s.addons.length>0&&<><h3>Add-on</h3>{s.addons.map(a=><p key={a.id}>{a.name} · {rupiah(a.price)}</p>)}</>}{s.serviceAreas.length>0&&<><h3>Area layanan</h3><p>{s.serviceAreas.map(x=>x.area.name).join(', ')}</p></>}</article><aside className="card public-booking-card"><h2>Pesan layanan</h2><p>Registrasi akun tidak wajib.</p><Link className="btn primary full-button" href={`/checkout?service=${s.id}`}>Pesan Sekarang</Link></aside></div></main></>;
}
