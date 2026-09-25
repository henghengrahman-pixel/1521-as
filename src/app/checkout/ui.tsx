"use client";
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {MapPin,CheckCircle2} from 'lucide-react';

type FieldErrors=Partial<Record<'name'|'phone'|'areaId'|'scheduledAt'|'address'|'quantity',string>>;
type ApiError={error?:string;message?:string;fields?:Record<string,string>};

export function CheckoutForm({service,areas,partner}:{service:{id:string;name:string;basePrice:number},areas:{id:string;name:string}[],partner?:{id:string;businessName:string;customPrice:number|null}|null}){
  const r=useRouter();
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState('');
  const [fieldErrors,setFieldErrors]=useState<FieldErrors>({});
  const [coords,setCoords]=useState<{lat:number;lng:number}|null>(null);

  function locate(){
    if(!navigator.geolocation){setErr('Lokasi perangkat tidak didukung browser ini. Silakan isi alamat secara manual.');return}
    navigator.geolocation.getCurrentPosition(
      x=>{setCoords({lat:x.coords.latitude,lng:x.coords.longitude});setErr('')},
      ()=>setErr('Lokasi perangkat tidak dapat diakses. Silakan isi alamat secara manual.')
    );
  }

  function validate(f:FormData){
    const errors:FieldErrors={};
    const name=String(f.get('name')||'').trim();
    const phone=String(f.get('phone')||'').replace(/[^0-9+]/g,'');
    const address=String(f.get('address')||'').trim();
    const areaId=String(f.get('areaId')||'');
    const scheduledAt=String(f.get('scheduledAt')||'');
    const quantity=Number(f.get('quantity')||1);
    if(name.length<2)errors.name='Nama minimal 2 karakter.';
    if(!/^\+?[0-9]{8,16}$/.test(phone))errors.phone='Masukkan nomor HP/WhatsApp yang valid (8–16 digit).';
    if(!areaId)errors.areaId='Pilih area layanan.';
    if(!scheduledAt||Number.isNaN(new Date(scheduledAt).getTime()))errors.scheduledAt='Pilih jadwal layanan yang valid.';
    if(address.length<8)errors.address='Alamat terlalu singkat. Masukkan alamat lengkap minimal 8 karakter.';
    else if(address.length>500)errors.address='Alamat maksimal 500 karakter.';
    if(!Number.isInteger(quantity)||quantity<1||quantity>20)errors.quantity='Jumlah harus antara 1 sampai 20.';
    return errors;
  }

  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    if(busy)return;
    const form=e.currentTarget;
    const f=new FormData(form);
    const localErrors=validate(f);
    setFieldErrors(localErrors);
    setErr('');
    const first=Object.keys(localErrors)[0];
    if(first){
      requestAnimationFrame(()=>form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus());
      return;
    }
    setBusy(true);
    try{
      const body={serviceId:service.id,partnerId:partner?.id,areaId:f.get('areaId'),name:f.get('name'),phone:f.get('phone'),address:f.get('address'),scheduledAt:f.get('scheduledAt'),quantity:Number(f.get('quantity')||1),note:f.get('note'),locationNote:f.get('locationNote'),paymentMethod:f.get('paymentMethod'),latitude:coords?.lat,longitude:coords?.lng};
      const res=await fetch('/api/orders',{method:'POST',headers:{'content-type':'application/json','idempotency-key':crypto.randomUUID()},body:JSON.stringify(body)});
      const j=(await res.json().catch(()=>({}))) as ApiError&{publicId?:string};
      if(!res.ok){
        if(j.fields){
          const next:FieldErrors={};
          for(const [key,value] of Object.entries(j.fields))if(['name','phone','areaId','scheduledAt','address','quantity'].includes(key))next[key as keyof FieldErrors]=value;
          setFieldErrors(next);
          const firstServer=Object.keys(next)[0];
          if(firstServer)requestAnimationFrame(()=>form.querySelector<HTMLElement>(`[name="${firstServer}"]`)?.focus());
        }
        setErr(j.message||j.error||'Pesanan belum berhasil dibuat. Periksa kembali data dan coba lagi.');
        return;
      }
      if(!j.publicId){setErr('Pesanan berhasil diproses tetapi nomor pesanan tidak diterima. Silakan hubungi JasaBatam.');return}
      r.push(`/pesanan/${j.publicId}`);
    }catch{
      setErr('Koneksi bermasalah. Silakan coba lagi.');
    }finally{setBusy(false)}
  }

  const invalid=(key:keyof FieldErrors)=>fieldErrors[key]?{'aria-invalid':true as const,'aria-describedby':`${key}-error`}:{};
  return <form onSubmit={submit} className="checkout-v6-card" noValidate>
    <div className="checkout-v6-head"><div><h2>Detail Pesanan</h2><p>Harga dihitung ulang di server saat order dibuat.</p>{partner&&<p><b>Mitra pilihan: {partner.businessName}</b></p>}</div><strong>Mulai Rp {service.basePrice.toLocaleString('id-ID')}</strong></div>
    <div className="checkout-v6-grid">
      <label>Nama<input required minLength={2} maxLength={100} name="name" autoComplete="name" {...invalid('name')}/>{fieldErrors.name&&<small id="name-error" className="field-error">{fieldErrors.name}</small>}</label>
      <label>No. HP / WhatsApp<input required name="phone" inputMode="tel" autoComplete="tel" placeholder="08xxxxxxxxxx" {...invalid('phone')}/>{fieldErrors.phone&&<small id="phone-error" className="field-error">{fieldErrors.phone}</small>}</label>
      <label>Area<select required name="areaId" {...invalid('areaId')}><option value="">Pilih area</option>{areas.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select>{fieldErrors.areaId&&<small id="areaId-error" className="field-error">{fieldErrors.areaId}</small>}</label>
      <label>Jadwal<input required type="datetime-local" name="scheduledAt" {...invalid('scheduledAt')}/>{fieldErrors.scheduledAt&&<small id="scheduledAt-error" className="field-error">{fieldErrors.scheduledAt}</small>}</label>
      <label className="full">Alamat lengkap<textarea required minLength={8} maxLength={500} name="address" rows={3} autoComplete="street-address" placeholder="Contoh: Perumahan Golden City Blok RA No. 3, Bengkong" {...invalid('address')}/>{fieldErrors.address&&<small id="address-error" className="field-error">{fieldErrors.address}</small>}</label>
      <label>Patokan / catatan lokasi<input name="locationNote" maxLength={300}/></label>
      <label>Jumlah<input required min="1" max="20" defaultValue="1" type="number" name="quantity" {...invalid('quantity')}/>{fieldErrors.quantity&&<small id="quantity-error" className="field-error">{fieldErrors.quantity}</small>}</label>
      <label>Metode pembayaran<select name="paymentMethod"><option value="CASH">Bayar setelah layanan / Cash</option><option value="TRANSFER">Transfer</option></select></label>
      <label className="full">Catatan<textarea name="note" rows={2} maxLength={1000}/></label>
    </div>
    <button type="button" className="btn outline checkout-v6-location" onClick={locate}>{coords?<><CheckCircle2 size={17}/> Lokasi perangkat tersimpan</>:<><MapPin size={17}/> Gunakan Lokasi Perangkat</>}</button>
    {coords&&<small className="muted">Lokasi perangkat akan divalidasi di server untuk matching; koordinat tidak ditampilkan di storefront.</small>}
    {err&&<p role="alert" className="checkout-v6-error">{err}</p>}
    <button disabled={busy} className="btn primary checkout-v6-submit">{busy?'Memproses...':'Konfirmasi Order'}</button>
  </form>
}
