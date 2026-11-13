 "use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Product = { id: string; title: string; description: string | null; price: number; image_url: string | null; category: string | null; };
export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Product[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [user, setUser] = useState<any>(null);
  const [orderName, setOrderName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  async function load() {
    if (!supabase) return;
    const { data } = await supabase.from("products").select("id,title,description,price,image_url,category").eq("status","approved").order("created_at",{ascending:false});
    setProducts(data || []);
    const { data: session } = await supabase.auth.getUser();
    setUser(session.user);
  }
  useEffect(() => { load(); }, []);
  const filtered = useMemo(() => products.filter(p => (p.title + " " + (p.category || "")).toLowerCase().includes(query.toLowerCase())), [products, query]);

  async function signIn() {
    if (!supabase) return setNotice("প্রথমে Supabase সেটআপ প্রয়োজন।");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setNotice(error ? error.message : "লগইন সফল। পৃষ্ঠা রিফ্রেশ করুন।");
    if (!error) await load();
  }
  async function signUp() {
    if (!supabase) return setNotice("প্রথমে Supabase সেটআপ প্রয়োজন।");
    const { error } = await supabase.auth.signUp({ email, password });
    setNotice(error ? error.message : "অ্যাকাউন্ট তৈরি হয়েছে। ইমেইল ভেরিফিকেশন চাইলে ইনবক্স দেখুন।");
  }
  async function checkout() {
    if (!supabase) return setNotice("প্রথমে Supabase সেটআপ প্রয়োজন।");
    if (!cart.length) return setNotice("কার্টে পণ্য যোগ করুন।");
    if (!orderName || !phone || !address) return setNotice("নাম, ফোন ও ঠিকানা পূরণ করুন।");
    if (!user) return setNotice("অর্ডার করতে আগে লগইন করুন।");
    const total = cart.reduce((s,p) => s + Number(p.price), 0);
    const { data: order, error } = await supabase.from("orders").insert({
      customer_id: user.id, customer_name: orderName, phone, delivery_address: address,
      total_amount: total, payment_method: "COD", status: "pending"
    }).select().single();
    if (error) return setNotice(error.message);
    const items = cart.map(p => ({ order_id: order.id, product_id: p.id, product_title: p.title, unit_price: p.price, quantity: 1 }));
    const result = await supabase.from("order_items").insert(items);
    if (result.error) return setNotice("অর্ডার তৈরি হয়েছে, তবে আইটেম সংরক্ষণে সমস্যা: " + result.error.message);
    setCart([]); setNotice("আপনার COD অর্ডার গ্রহণ করা হয়েছে। অর্ডার নম্বর: " + order.id);
  }

  return <main>
    <header className="top"><a className="brand" href="/">Maliha <b>Store Plus</b></a><nav><a href="#products">পণ্য</a><a href="#seller">বিক্রেতা</a><a href="#account">অ্যাকাউন্ট</a><a href="#cart">কার্ট ({cart.length})</a></nav></header>
    <section className="hero"><div><span className="eyebrow">বাংলাদেশের মাল্টি-ভেন্ডর মার্কেটপ্লেস</span><h1>কেনাকাটা হোক<br/><em>আরও সহজ</em></h1><p>এক জায়গায় পছন্দের পণ্য, বিভিন্ন বিক্রেতা এবং ক্যাশ অন ডেলিভারি।</p><a className="primary" href="#products">কেনাকাটা শুরু করুন</a></div><div className="heroArt"><div className="orb">M</div><div className="floating">বিশ্বাসের সাথে কেনাকাটা</div></div></section>
    <section className="benefits"><div>🚚 <b>সহজ ডেলিভারি</b><small>কুরিয়ার ও নিজস্ব ডেলিভারি</small></div><div>💵 <b>Cash on Delivery</b><small>পণ্য হাতে পেয়ে মূল্য দিন</small></div><div>🏪 <b>বহু বিক্রেতা</b><small>এক প্ল্যাটফর্মে অনেক দোকান</small></div></section>
    <section id="products" className="section"><div className="sectionHead"><div><span className="eyebrow">SHOP THE COLLECTION</span><h2>জনপ্রিয় পণ্য</h2></div><input className="search" placeholder="পণ্য খুঁজুন..." value={query} onChange={e=>setQuery(e.target.value)}/></div>
      {!supabase && <p className="notice">ওয়েবসাইট চালু করতে Supabase URL ও key যোগ করতে হবে। README.md দেখুন।</p>}
      <div className="products">{filtered.map(p=><article className="product" key={p.id}><div className="productImg">{p.image_url ? <img src={p.image_url} alt={p.title}/> : <span>🛍️</span>}</div><div className="productInfo"><small>{p.category || "অন্যান্য"}</small><h3>{p.title}</h3><p>{p.description}</p><strong>৳ {Number(p.price).toLocaleString("en-BD")}</strong><button onClick={()=>setCart(c=>[...c,p])}>কার্টে যোগ করুন</button></div></article>)}</div>
      {supabase && products.length===0 && <div className="empty">এখনো কোনো অনুমোদিত পণ্য নেই। Admin/Seller প্যানেল থেকে পণ্য যোগ করুন।</div>}
    </section>
    <section id="seller" className="sellerBand"><div><span className="eyebrow">GROW WITH US</span><h2>আপনি কি বিক্রি করতে চান?</h2><p>Maliha Store Plus-এ বিক্রেতা হিসেবে যোগ দিন এবং নিজের পণ্য অনলাইনে তুলে ধরুন।</p></div><a className="primary light" href="#account">বিক্রেতা অ্যাকাউন্ট খুলুন</a></section>
    <section id="account" className="section two"><div><span className="eyebrow">YOUR ACCOUNT</span><h2>লগইন / রেজিস্ট্রেশন</h2><p>একটি অ্যাকাউন্ট দিয়ে ক্রেতা বা বিক্রেতা হিসেবে শুরু করুন।</p><input placeholder="ইমেইল" type="email" value={email} onChange={e=>setEmail(e.target.value)}/><input placeholder="পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)" type="password" value={password} onChange={e=>setPassword(e.target.value)}/><div className="actions"><button onClick={signIn}>লগইন</button><button className="outline" onClick={signUp}>নতুন অ্যাকাউন্ট</button></div><a className="textLink" href="/seller">Seller Dashboard →</a> <a className="textLink" href="/admin">Admin Panel →</a></div>
      <div id="cart"><span className="eyebrow">CHECKOUT</span><h2>আপনার কার্ট ({cart.length})</h2>{cart.map((p,i)=><div className="cartLine" key={i}>{p.title}<b>৳{p.price}</b></div>)}<div className="total">মোট: ৳{cart.reduce((s,p)=>s+Number(p.price),0).toLocaleString("en-BD")}</div><input placeholder="আপনার নাম" value={orderName} onChange={e=>setOrderName(e.target.value)}/><input placeholder="মোবাইল নম্বর" value={phone} onChange={e=>setPhone(e.target.value)}/><textarea placeholder="সম্পূর্ণ ডেলিভারি ঠিকানা" value={address} onChange={e=>setAddress(e.target.value)}/><button onClick={checkout}>Cash on Delivery অর্ডার করুন</button></div></section>
    {notice && <div className="toast" role="status">{notice}<button onClick={()=>setNotice("")}>×</button></div>}
    <footer><b>Maliha Store Plus</b><p>আপনার অনলাইন মার্কেটপ্লেস</p><small>© {new Date().getFullYear()} Maliha Store Plus. All rights reserved.</small></footer>
  </main>;
}