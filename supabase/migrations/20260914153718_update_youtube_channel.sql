-- Replace the placeholder YouTube destination and featured video with
-- content published by the official PIB Jussara channel.
update public.site_settings
set
  youtube_url = 'https://www.youtube.com/@primeiraigrejabatistajussa4897',
  youtube_live_url = 'https://www.youtube.com/watch?v=6wbCaXoq6cM'
where id = true;
