// import { createClient } from "@/lib/supabase/client";

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
// The client you created from the Server-Side Auth instructions

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Check if we're in development mode
      const isLocalEnv = process.env.NODE_ENV === "development"
console.log(isLocalEnv)
      if (isLocalEnv) {
        // In development, always redirect to localhost
        return NextResponse.redirect(`http://localhost:3000${next}`)
      } else {
        // In production, use the forwarded host or origin
        const forwardedHost = request.headers.get("x-forwarded-host")
        if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${next}`)
        } else {
          return NextResponse.redirect(`${origin}${next}`)
        }
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
