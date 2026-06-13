import type { Metadata } from 'next'
import { BuildSubmitForm } from '@/components/gallery/BuildSubmitForm'

export const metadata: Metadata = {
  title: 'Submit Your Build',
  description: 'Share your build with the Ruckus Renditions community.',
}

export default function SubmitBuildPage() {
  return (
    <main className="min-h-screen bg-ruckus-black text-white">
      <div className="mx-auto max-w-xl px-4 py-10">
        <h1 className="mb-2 text-3xl font-black uppercase tracking-tight">Submit Your Build</h1>
        <p className="mb-8 text-gray-500">Show the community what you built. Approved builds are featured in the gallery.</p>
        <BuildSubmitForm />
      </div>
    </main>
  )
}
