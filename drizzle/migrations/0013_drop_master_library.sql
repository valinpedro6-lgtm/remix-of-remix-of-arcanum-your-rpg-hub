DROP TABLE IF EXISTS public.master_library;

DELETE FROM storage.objects
WHERE bucket_id = 'arcanum-library';

DELETE FROM storage.buckets
WHERE id = 'arcanum-library';
