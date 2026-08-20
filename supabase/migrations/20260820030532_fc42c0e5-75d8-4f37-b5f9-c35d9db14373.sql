WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY lower(city), round(latitude, 2), round(longitude, 2)
           ORDER BY (pincode IS NOT NULL) DESC, (external_id IS NOT NULL) DESC, created_at ASC
         ) AS rn
  FROM public.hospital_directory
)
DELETE FROM public.hospital_directory h
USING ranked r
WHERE h.id = r.id AND r.rn > 1;

UPDATE public.hospital_directory SET pincode = v.pin
FROM (VALUES
  ('CUR-AIIMS-DEL','110029'),('CUR-KEM-MUM','400012'),('CUR-LIL-MUM','400050'),
  ('CUR-APOLLO-CHE','600006'),('CUR-FORTIS-BLR','560076'),('CUR-RUBY-PUN','411001'),
  ('CUR-NIMS-HYD','500082'),('CUR-PGIMER-CHD','160012'),('CUR-CMC-VEL','632004'),
  ('CUR-SGPGI-LKO','226014'),('CUR-SMS-JAI','302004'),('CUR-AMRI-KOL','700029')
) AS v(ext, pin)
WHERE public.hospital_directory.external_id = v.ext AND public.hospital_directory.pincode IS NULL;

UPDATE public.hospital_directory SET pincode = v.pin
FROM (VALUES
  ('Jaslok Hospital','400026'),('Sri Ramachandra Medical Centre','600116'),
  ('Sree Chitra Tirunal Institute','695011'),('IMS BHU Sir Sunderlal Hospital','221005'),
  ('Rashid Hospital','00000'),('Singapore General Hospital','169608'),
  ('Medical College Kolkata','700073'),('Sion Hospital (LTMGH)','400022'),
  ('Fortis Hospital Bannerghatta Road','560076'),('Christian Medical College Vellore','632004'),
  ('Guwahati Medical College Hospital','781032')
) AS v(hname, pin)
WHERE public.hospital_directory.name = v.hname AND public.hospital_directory.pincode IS NULL;