import type {Metadata} from 'next';
import {db} from '@/lib/db';
import {Header} from '@/components/Header';
import {ServiceCard} from '@/components/ServiceCard';
import {notFound} from 'next/navigation';
import {NearbyPartners} from '@/components/NearbyPartners';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{category:string}>}):Promise<Metadata>{
  const {category}=await params;const c=await db.category.findFirst({where:{slug:category,active:true,archivedAt:null},select:{name:true,seoTitle:true,seoDescription:true,description:true}});
  if(!c)return {title:'Kategori tidak ditemukan',robots:{index:false,follow:false}};
  const title=c.seoTitle||`${c.name} di Batam — Harga & Jasa Terpercaya`;const description=c.seoDescription||c.description||`Temukan dan pesan layanan ${c.name} di Batam sesuai area dan jadwal Anda.`;
  return {title,description,alternates:{canonical:`/jasa/${category}`},openGraph:{title,description,url:`/jasa/${category}`}};
}
export default async function Page({params}:{params:Promise<{category:string}>}){
  const {category}=await params;
  const c=await db.category.findFirst({where:{slug:category,active:true,archivedAt:null},include:{services:{where:{active:true,archivedAt:null},include:{category:true},orderBy:[{sortOrder:'asc'},{name:'asc'}]}}});
  if(!c)notFound();
  const areas=await db.area.findMany({where:{active:true},select:{slug:true,name:true},orderBy:{name:'asc'}});
  const base=process.env.NEXT_PUBLIC_APP_URL||'https://jasabatam.com';const schema={'@context':'https://schema.org','@type':'CollectionPage',name:`${c.name} di Batam`,description:c.seoDescription||c.description||undefined,url:`${base}/jasa/${c.slug}`,mainEntity:{'@type':'ItemList',itemListElement:c.services.map((s,i)=>({'@type':'ListItem',position:i+1,name:s.name,url:`${base}/jasa/${c.slug}/${s.slug}`}))}};
  return <><Header/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\\u003c')}}/><main className="container section"><p className="muted">Beranda / Jasa / {c.name}</p><h1>{c.name} di Batam</h1><p>{c.description||`Temukan layanan ${c.name} untuk area Batam dengan harga transparan.`}</p><NearbyPartners category={c.slug} areas={areas}/>{c.services.length?<div className="grid public-service-grid">{c.services.map(s=><ServiceCard key={s.id} s={s}/>)}</div>:<p className="empty-state">Belum ada layanan aktif pada kategori ini.</p>}</main></>;
}
