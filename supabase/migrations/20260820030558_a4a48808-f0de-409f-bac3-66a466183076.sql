UPDATE public.hospital_directory SET pincode = v.pin
FROM (VALUES
  ('Osmania General Hospital','500012'),('Narayana Institute of Cardiac Sciences','560099'),
  ('Max Super Speciality Hospital Saket','110017'),('SMS Hospital Jaipur','302004'),
  ('Lok Nayak Hospital','110002'),('Nizam''s Institute of Medical Sciences','500082'),
  ('SGPGI Lucknow','226014')
) AS v(hname, pin)
WHERE public.hospital_directory.name = v.hname AND public.hospital_directory.pincode IS NULL;