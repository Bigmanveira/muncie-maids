import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { getAuthedOps } from '../_shared/opsAuth.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405)

  const ops = await getAuthedOps(req)
  if (!ops) return errorResponse('UNAUTHORIZED', 'Sign in required.', 401)

  const supabase = getSupabaseAdmin()
  const { data: cleaners, error } = await supabase
    .from('cleaners')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return errorResponse('UNKNOWN', 'Could not load cleaners', 500)

  return jsonResponse({
    cleaners: (cleaners ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      towns: c.towns,
      services: c.services,
      yearsExperience: c.years_experience,
      hasOwnEquipment: c.has_own_equipment,
      status: c.status,
      agreementSignedAt: c.agreement_signed_at,
      reliabilityCompleted: c.reliability_completed,
      reliabilityReleased: c.reliability_released,
      createdAt: c.created_at,
      // Vetting (0009). Document paths are intentionally mapped to booleans —
      // ops views the actual files via short-lived signed URLs from
      // ops-get-cleaner-docs, so raw storage paths never leave the server.
      legalName: c.legal_name,
      dateOfBirth: c.date_of_birth,
      addressLine1: c.address_line1,
      addressCity: c.address_city,
      addressState: c.address_state,
      addressZip: c.address_zip,
      hasTransportation: c.has_transportation,
      hasDriversLicense: c.has_drivers_license,
      workEligibleAttestedAt: c.work_eligible_attested_at,
      emergencyContactName: c.emergency_contact_name,
      emergencyContactPhone: c.emergency_contact_phone,
      referenceContacts: c.reference_contacts ?? [],
      hasIdDocument: Boolean(c.id_document_path),
      hasProfilePhoto: Boolean(c.profile_photo_path),
      bgCheckConsentedAt: c.bg_check_consented_at,
      bgCheckStatus: c.bg_check_status,
      bgCheckProvider: c.bg_check_provider,
      bgCheckReference: c.bg_check_reference,
      bgCheckCompletedAt: c.bg_check_completed_at,
      verificationSubmittedAt: c.verification_submitted_at,
    })),
  })
})
