import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SiteContent {
  id: string;
  key: string;
  content_type: string;
  value: string;
  updated_at: string;
  updated_by: string | null;
}

interface SiteAsset {
  id: string;
  section_key: string;
  url: string;
  alt_text: string | null;
  updated_at: string;
  updated_by: string | null;
}

export const useSiteContent = () => {
  const queryClient = useQueryClient();

  const { data: contents } = useQuery({
    queryKey: ["site-content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("*");
      if (error) throw error;
      return data as SiteContent[];
    },
    staleTime: 60000,
  });

  const { data: assets } = useQuery({
    queryKey: ["site-assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_assets")
        .select("*");
      if (error) throw error;
      return data as SiteAsset[];
    },
    staleTime: 60000,
  });

  const getText = (key: string, fallback: string): string => {
    const item = contents?.find((c) => c.key === key);
    return item?.value || fallback;
  };

  const getAsset = (sectionKey: string, fallbackUrl: string, fallbackAlt = ""): { url: string; alt: string } => {
    const item = assets?.find((a) => a.section_key === sectionKey);
    return {
      url: item?.url || fallbackUrl,
      alt: item?.alt_text || fallbackAlt,
    };
  };

  const updateText = useMutation({
    mutationFn: async ({ key, value, contentType = "text" }: { key: string; value: string; contentType?: string }) => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      // Sanitize: strip HTML tags for plain text
      const sanitized = contentType === "text" ? value.replace(/<[^>]*>/g, "").trim() : value.trim();

      const { error } = await supabase
        .from("site_content")
        .upsert(
          { key, value: sanitized, content_type: contentType, updated_by: userId },
          { onConflict: "key" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-content"] });
      toast.success("Contenido actualizado");
    },
    onError: () => toast.error("Error al guardar"),
  });

  const updateAsset = useMutation({
    mutationFn: async ({ sectionKey, file, altText = "" }: { sectionKey: string; file: File; altText?: string }) => {
      // Validate file
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
      if (!allowedTypes.includes(file.type)) {
        throw new Error("Tipo de archivo no permitido. Usá JPG, PNG, WebP o SVG.");
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("El archivo es muy grande (máx 5MB).");
      }

      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      const ext = file.name.split(".").pop();
      const path = `${sectionKey}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("site-assets")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("site-assets")
        .getPublicUrl(path);

      const { error } = await supabase
        .from("site_assets")
        .upsert(
          { section_key: sectionKey, url: urlData.publicUrl, alt_text: altText, updated_by: userId },
          { onConflict: "section_key" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-assets"] });
      toast.success("Imagen actualizada");
    },
    onError: (err: Error) => toast.error(err.message || "Error al subir imagen"),
  });

  return { getText, getAsset, updateText, updateAsset, contents, assets };
};
