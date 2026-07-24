import { createClient } from '@supabase/supabase-js';
const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
const supabase = createClient(url, key);

async function fetchSample(part: any) {
  let query: any = supabase
    .from('synnex_products')
    .select('image_url,name')
    .eq('price_approved', true)
    .not('image_url', 'is', null)
    .limit(1);

  switch (part.type) {
    case 'CPU':
      query = query
        .eq('category', 'Components')
        .or('name.ilike.%CPU%,name.ilike.%Ryzen%,name.ilike.%Core i%,name.ilike.%Core Ultra%');
      break;
    case 'MB':
      query = query
        .eq('category', 'Components')
        .or('name.ilike.%Mainboard%,name.ilike.%B850M%,name.ilike.%B760M%,name.ilike.%Motherboard%');
      break;
    case 'RAM':
      query = query
        .eq('category', 'Storage')
        .ilike('name', '%DDR%')
        .not('name', 'ilike', '%SSD%');
      break;
    case 'GPU':
      query = query
        .eq('category', 'Components')
        .or('name.ilike.%RTX%,name.ilike.%Radeon%,name.ilike.%GeForce%,name.ilike.%RX 7%,name.ilike.%RX 9%')
        .not('name', 'ilike', '%CPU%')
        .not('name', 'ilike', '%Mainboard%');
      break;
  }
  const { data, error } = await query;
  console.log(part.type, error?.message ?? 'ok', data);
}

Promise.all([
  fetchSample({ type: 'CPU' }),
  fetchSample({ type: 'MB' }),
  fetchSample({ type: 'RAM' }),
  fetchSample({ type: 'GPU' }),
]);
