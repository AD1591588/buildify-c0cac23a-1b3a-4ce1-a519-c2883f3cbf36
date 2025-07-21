
// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.com/manual/getting_started/javascript

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get the current user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get request data
    const formData = await req.formData();
    const modelFile = formData.get("model") as File;
    const thumbnailFile = formData.get("thumbnail") as File | null;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;

    if (!modelFile || !name || !category) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Upload model file to storage
    const modelFileName = `${user.id}/${Date.now()}_${modelFile.name}`;
    const { data: modelData, error: modelError } = await supabaseClient.storage
      .from("models")
      .upload(modelFileName, modelFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (modelError) {
      return new Response(
        JSON.stringify({ error: modelError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get public URL for the model
    const { data: modelUrl } = supabaseClient.storage
      .from("models")
      .getPublicUrl(modelFileName);

    let thumbnailUrl = null;

    // Upload thumbnail if provided
    if (thumbnailFile) {
      const thumbnailFileName = `${user.id}/${Date.now()}_${thumbnailFile.name}`;
      const { data: thumbnailData, error: thumbnailError } = await supabaseClient.storage
        .from("thumbnails")
        .upload(thumbnailFileName, thumbnailFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (thumbnailError) {
        return new Response(
          JSON.stringify({ error: thumbnailError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Get public URL for the thumbnail
      const { data: thumbUrl } = supabaseClient.storage
        .from("thumbnails")
        .getPublicUrl(thumbnailFileName);
        
      thumbnailUrl = thumbUrl.publicUrl;
    }

    // Save model information to database
    const { data: modelRecord, error: dbError } = await supabaseClient
      .from("user_models")
      .insert({
        user_id: user.id,
        name,
        description,
        category,
        model_url: modelUrl.publicUrl,
        thumbnail_url: thumbnailUrl,
      })
      .select()
      .single();

    if (dbError) {
      return new Response(
        JSON.stringify({ error: dbError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        model: modelRecord,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});