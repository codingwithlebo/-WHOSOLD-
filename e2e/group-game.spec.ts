import { expect, test, type Page } from '@playwright/test'

const localSupabaseConfigured =
  Boolean(process.env.VITE_SUPABASE_URL) &&
  Boolean(process.env.VITE_SUPABASE_ANON_KEY)

async function signIn(page: Page, email: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('Password123!')
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
}

test('two members share a wishlist and start a group round', async ({
  browser,
}) => {
  test.setTimeout(90_000)
  test.skip(
    !localSupabaseConfigured,
    'Start local Supabase and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
  )

  const leader = await browser.newPage()
  const member = await browser.newPage()
  const groupName = `Browser crew ${Date.now()}`
  const itemName = `Shared item ${Date.now()}`

  try {
    await signIn(leader, 'alice@test.dev')
    await leader.getByLabel('Group name').fill(groupName)
    await leader.getByRole('button', { name: 'Create group' }).click()

    const groupCard = leader
      .locator('li')
      .filter({ has: leader.getByRole('heading', { name: groupName }) })
    const joinCode = await groupCard.locator('.font-mono').textContent()
    expect(joinCode).toMatch(/^[A-Z0-9]{6}$/)

    await signIn(member, 'bob@test.dev')
    await member.getByLabel('Join code').fill(joinCode ?? '')
    await member.getByRole('button', { name: 'Join group' }).click()
    const groupHeading = member.getByRole('heading', { name: groupName })
    await expect
      .poll(
        async () => {
          if (await groupHeading.isVisible()) return 'joined'
          const alert = member.getByRole('alert')
          if (await alert.count()) return `error: ${await alert.innerText()}`
          return 'pending'
        },
        { timeout: 15_000 },
      )
      .toBe('joined')

    await member.getByRole('link', { name: `Open ${groupName}` }).click()
    await expect(
      member.getByRole('heading', { name: 'Group wishlist' }),
    ).toBeVisible()
    await member.getByLabel('Item name').fill(itemName)
    await member.getByLabel('Price (Rand)').fill('1000')
    await member.getByRole('button', { name: 'Add item' }).click()
    await expect(member.getByText(itemName)).toBeVisible()

    await leader.getByRole('link', { name: `Open ${groupName}` }).click()
    await expect(leader.getByText(itemName)).toBeVisible()
    await leader.getByRole('link', { name: 'Back to groups' }).click()
    await groupCard.getByRole('button', { name: 'Lock group' }).click()
    await expect(leader.getByText('Group locked')).toBeVisible()
    await leader.getByRole('link', { name: `Open ${groupName}` }).click()
    await expect(
      leader.getByRole('heading', { name: 'Schedule a round' }),
    ).toBeVisible()

    await leader.getByRole('button', { name: 'Start round' }).click()
    await expect(leader).toHaveURL(/\/groups\/[^/]+\/round$/)
    await expect(
      leader.getByRole('heading', { name: 'Double or Pass?' }),
    ).toBeVisible()
  } finally {
    await leader.close()
    await member.close()
  }
})
