const BASE = 'http://localhost:3000/api';

// First, ensure categories exist
await fetch(`${BASE}/categories`);

// Fetch categories to use real names
const catRes = await fetch(`${BASE}/categories`);
const catData = await catRes.json();
const cats = catData.categories || [];
const expenseCats = cats.filter(c => c.type === 'expense').map(c => c.name);
const incomeCats = cats.filter(c => c.type === 'income').map(c => c.name);

if (expenseCats.length === 0) {
  console.log('No categories found. Creating defaults...');
  for (const name of ['Feed','Medicine','Labor','Transport','Veterinary','Maintenance','Electricity','Water','Other']) {
    await fetch(`${BASE}/categories`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name, type:'expense'}) });
  }
  for (const name of ['Cow Sale','Milk Sale','Manure Sale','Other']) {
    await fetch(`${BASE}/categories`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name, type:'income'}) });
  }
  expenseCats.push('Feed','Medicine','Labor','Transport','Veterinary','Maintenance','Electricity','Water','Other');
  incomeCats.push('Cow Sale','Milk Sale','Manure Sale','Other');
}

const breeds = ['Shahiwal','Red Chittagong','Friesian Cross','Desi','Holstein','Jersey Cross','Pabna','Munshiganj'];
const names = ['Lali','Kali','Dholu','Shona','Rani','Sundori','Moti','Champa','Tara','Nila','Gouri','Meena','Rupa','Jharna','Bela','Pori','Doly','Luna','Mina','Jolly'];

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function fmt(d) { return d.toISOString().split('T')[0]; }

// ─── Create 20 Cows ───
console.log('Creating 20 cows...');
const cowIds = [];
for (let i = 0; i < 20; i++) {
  const purchaseDate = randomDate(new Date(2025, 0, 1), new Date(2026, 2, 1));
  const cow = {
    tag: `COW-${2025 + Math.floor(i/10)}${String(100 + i).padStart(3,'0')}`,
    name: names[i],
    breed: pick(breeds),
    purchaseDate: fmt(purchaseDate),
    purchasePrice: randomInt(30000, 120000),
    weight: randomInt(150, 450),
    status: i >= 17 ? 'sold' : 'active',
  };
  if (cow.status === 'sold') {
    cow.sellDate = fmt(randomDate(new Date(2026, 2, 1), new Date(2026, 4, 15)));
    cow.sellPrice = cow.purchasePrice + randomInt(5000, 40000);
    cow.buyerName = pick(['Rahim','Karim','Jalal','Faruk','Mamun']);
  }
  const res = await fetch(`${BASE}/cows`, {
    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(cow),
  });
  const data = await res.json();
  if (data._id) { cowIds.push(data._id); console.log(`  ✓ ${cow.tag} - ${cow.name} (${cow.breed})`); }
  else console.log(`  ✗ ${cow.tag} - ${JSON.stringify(data)}`);
}

// ─── Create 40 Expense Transactions (March–May 2026) ───
console.log('\nCreating 40 expenses (March-May)...');
const expenseDescs = {
  'Feed': ['Bought ghash from market','Monthly cattle feed','Bhushi 5 bags','Khar purchase','Silage for cows'],
  'Medicine': ['Deworming tablets','Calcium injection','Vitamin supplements','Antibiotics for sick cow','FMD vaccine'],
  'Labor': ['Monthly worker salary','Extra helper for 3 days','Night guard payment','Cleaning labor','Weekend worker'],
  'Transport': ['Feed transport from town','Cow transport to vet','Pickup van rent','Auto rickshaw for medicine','Truck for hay'],
  'Veterinary': ['Vet visit for checkup','Emergency vet call','Pregnancy checkup','Hoof trimming','AI service'],
  'Maintenance': ['Shed repair','Water pipe fix','Fence repair','Roof patching','Floor cleaning supplies'],
  'Electricity': ['Monthly electricity bill','Generator fuel','Solar panel maintenance'],
  'Water': ['Water pump repair','Monthly water bill','Bore well maintenance'],
  'Other': ['Rope and chain purchase','Bucket and containers','Mosquito coil for shed'],
};

for (let i = 0; i < 40; i++) {
  const cat = pick(expenseCats);
  const descs = expenseDescs[cat] || ['General expense'];
  const monthOffset = Math.floor(i / 14); // spread across 3 months
  const txDate = randomDate(new Date(2026, 2 + Math.min(monthOffset, 2), 1), new Date(2026, 2 + Math.min(monthOffset, 2) + 1, 0));
  const isShared = Math.random() > 0.3;
  const tx = {
    type: 'expense',
    category: cat,
    amount: cat === 'Feed' ? randomInt(3000, 15000)
      : cat === 'Labor' ? randomInt(5000, 12000)
      : cat === 'Electricity' ? randomInt(1500, 4000)
      : cat === 'Veterinary' ? randomInt(500, 5000)
      : randomInt(500, 8000),
    date: fmt(txDate),
    description: pick(descs),
    cowId: isShared ? null : pick(cowIds),
    isShared,
  };
  const res = await fetch(`${BASE}/transactions`, {
    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(tx),
  });
  const ok = res.ok;
  console.log(`  ${ok ? '✓' : '✗'} ${tx.date} | ${tx.category} | ৳${tx.amount} | ${isShared ? 'Shared' : 'Individual'}`);
}

// ─── Create 10 Income Transactions (March–May 2026) ───
console.log('\nCreating 10 income transactions...');
const incomeDescs = {
  'Cow Sale': ['Sold cow to Rahim bhai','Cow sold at local haat','Sold to dealer'],
  'Milk Sale': ['Weekly milk sale','Monthly milk to dairy','Milk sold to neighbors','Morning milk collection'],
  'Manure Sale': ['Sold manure to farmer','Gobar sold for biogas','Monthly manure pickup'],
  'Other': ['Cow rental for plowing','Government subsidy received'],
};

for (let i = 0; i < 10; i++) {
  const cat = i < 2 ? 'Cow Sale' : i < 7 ? 'Milk Sale' : pick(incomeCats);
  const descs = incomeDescs[cat] || ['Other income'];
  const txDate = randomDate(new Date(2026, 2, 1), new Date(2026, 4, 17));
  const tx = {
    type: 'income',
    category: cat,
    amount: cat === 'Cow Sale' ? randomInt(50000, 150000)
      : cat === 'Milk Sale' ? randomInt(2000, 8000)
      : randomInt(1000, 5000),
    date: fmt(txDate),
    description: pick(descs),
    cowId: cat === 'Cow Sale' ? pick(cowIds) : null,
  };
  const res = await fetch(`${BASE}/transactions`, {
    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(tx),
  });
  console.log(`  ${res.ok ? '✓' : '✗'} ${tx.date} | ${tx.category} | ৳${tx.amount}`);
}

console.log('\n✅ Seeding complete! Refresh the dashboard to see the data.');
