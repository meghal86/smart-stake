-- Seed common CEX labels (idempotent upserts)
insert into public.whale_entities (address, chain, label, entity_type, is_cex, meta)
values
  ('0x28c6c06298d514db089934071355e5743bf21d60', 'ethereum', 'Binance',  'exchange', true, '{}'::jsonb),
  ('0x21a31ee1afc51d94c2efccaa2092ad1028285549', 'ethereum', 'Binance 2','exchange', true, '{}'::jsonb),
  ('0x564286362092d8e7936f0549571a803b203aaced', 'ethereum', 'Binance 3','exchange', true, '{}'::jsonb),
  ('0x0681d8db095565fe8a346fa0277bffde9c0edbbf', 'ethereum', 'Kraken',   'exchange', true, '{}'::jsonb),
  ('0xe93381fb4c4f14bda253907b18fad305d799241a', 'ethereum', 'Huobi',    'exchange', true, '{}'::jsonb),
  ('0x32be343b94f860124dc4fee278fdcbd38c102d88', 'ethereum', 'Poloniex', 'exchange', true, '{}'::jsonb)
on conflict (chain, address) do update
set
  label = excluded.label,
  entity_type = excluded.entity_type,
  is_cex = excluded.is_cex,
  meta = excluded.meta,
  updated_at = now();

