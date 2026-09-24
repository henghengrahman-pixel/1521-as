import type {Metadata} from 'next';
import Link from 'next/link';
import {Prisma} from '@prisma/client';
import {db} from '@/lib/db';
import {Header} from '@/components/Header';
import {ServiceCard} from '@/components/ServiceCard';
import {EmptyState} from '@/components/AdminBits';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Cari Jasa di Batam',description:'Cari service AC, laundry, cleaning, tukang, elektronik, pindahan dan jasa rumah lainnya di berbagai area Batam.',alternates:{canonical:'/jasa'}};

export default async function Page({searchParams}:{searchParams:Promise<{q?:string;area?:string;page?:string}>}){
  const {q,area,page:pageRaw}=await searchParams;const page=Math.max(1,Number.parseInt(pageRaw||'1',10)||1);const pageSize=24;const keyword=q?.trim()||'';
  const selectedArea=area?await db.area.findFirst({where:{slug:area,active:true},select:{id:true,name:true}}):null;
  const and:Prisma.ServiceWhereInput[]=[];
  if(keyword)and.push({OR:[{name:{contains:keyword,mode:'insensitive'}},{category:{name:{contains:keyword,mode:'insensitive'}}},{description:{contains:keyword,mode:'insensitive'}}]});
  if(selectedArea)and.push({OR:[{serviceAreas:{none:{}}},{serviceAreas:{some:{areaId:selectedArea.id,active:true}}}]});
  const where:Prisma.ServiceWhereInput={active:true,archivedAt:null,category:{active:true,archivedAt:null},...(and.length?{AND:and}:{})};
  const [services,total,areas]=await Promise.all([
    db.service.findMany({where,include:{category:true},orderBy:[{featured:'desc'},{sortOrder:'asc'},{name:'asc'}],skip:(page-1)*pageSize,take:pageSize}),
    db.service.count({where}),db.area.findMany({where:{active:true},orderBy:{name:'asc'}})
  ]);
  const params=new URLSearchParams();if(keyword)params.set('q',keyword);if(area)params.set('area',area);const pages=Math.max(1,Math.ceil(total/pageSize));
  const href=(target:number)=>{const p=new URLSearchParams(params);p.set('page',String(target));return `/jasa?${p.toString()}`};
  return <><Header/><main className="container section"><div className="page-header"><div><h1 className="page-title">{selectedArea?`Jasa di ${selectedArea.name}, Batam`:'Semua Jasa di Batam'}</h1><p className="page-description">Pilih layanan aktif sesuai area, kebutuhan, dan jadwal Anda.</p></div></div><form className="searchbar public-searchbar"><select name="area" defaultValue={area||''}><option value="">Semua area</option>{areas.map(a=><option key={a.id} value={a.slug}>{a.name}</option>)}</select><input name="q" defaultValue={keyword} placeholder="Cari jasa..."/><button className="btn primary">Cari</button></form>{services.length?<div className="grid service-grid public-service-grid">{services.map(s=><ServiceCard key={s.id} s={s}/>)}</div>:<EmptyState title="Belum ada layanan yang cocok" description="Coba area atau kata pencarian lain."/>}{pages>1&&<nav className="pagination" aria-label="Pagination layanan"><span>Halaman {page} dari {pages} • {total} layanan</span><div className="pagination-actions">{page>1&&<Link href={href(page-1)}>Sebelumnya</Link>}{page<pages&&<Link href={href(page+1)}>Berikutnya</Link>}</div></nav>}</main></>;
}
