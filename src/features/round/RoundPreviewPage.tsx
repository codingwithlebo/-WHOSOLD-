import { useState } from 'react'
import RoundPage from './RoundPage'

const HOUR = 60 * 60 * 1000

function buildPreviewSchedule() {
  const now = Date.now()
  return {
    opensAt: new Date(now - 60_000).toISOString(),
    closesAt: new Date(now + HOUR).toISOString(),
    releaseAt: new Date(now + 24 * HOUR).toISOString(),
  }
}

/** Contract-accurate Double or Pass screens running on demo data only. */
export default function RoundPreviewPage() {
  const [schedule] = useState(buildPreviewSchedule)

  return (
    <>
      <p
        className="mx-auto mt-4 w-full max-w-2xl rounded-xl border border-dashed px-4 py-2 text-center text-sm font-semibold"
        role="note"
      >
        PREVIEW: demo data only. Choices are not saved yet.
      </p>
      <RoundPage
        answeredCount={2}
        closesAt={schedule.closesAt}
        groupName="Demo Crew"
        memberCount={4}
        myChoice={null}
        onSubmitChoice={async () => {
          await new Promise((resolve) => setTimeout(resolve, 400))
        }}
        opensAt={schedule.opensAt}
        releaseAt={schedule.releaseAt}
        startingFundCents={2749900}
      />
    </>
  )
}