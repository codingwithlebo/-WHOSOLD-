import { expect, test } from '@playwright/test'

const publicRoutes = [
  { path: '/', heading: undefined },
  { path: '/login', heading: 'Welcome back' },
  { path: '/signup', heading: 'Join the game' },
]

for (const { path, heading } of publicRoutes) {
  test(`${path} is usable at 360px without horizontal overflow`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.goto(path)

    await expect(page.locator('#main')).toBeVisible()
    if (heading) {
      await expect(page.getByRole('heading', { name: heading })).toBeVisible()
    }

    const bodyWidth = await page.locator('body').evaluate((element) => {
      return element.scrollWidth
    })
    const documentWidth = await page.locator('html').evaluate((element) => {
      return element.scrollWidth
    })
    expect(Math.max(bodyWidth, documentWidth)).toBeLessThanOrEqual(360)
  })
}

test('the log-in form is reachable and validatable by keyboard', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('/login')

  const tabOrder = [
    page.getByRole('link', { name: 'Skip to content' }),
    page.getByRole('link', { name: 'WHOSOLD? home' }),
    page.getByRole('link', { name: 'Log in' }),
    page.getByRole('link', { name: 'Start a group' }),
    page.getByRole('textbox', { name: 'Email' }),
    page.getByLabel('Password'),
    page.getByRole('button', { name: 'Log in' }),
  ]

  for (const target of tabOrder) {
    await page.keyboard.press('Tab')
    await expect(target).toBeFocused()
  }

  await page.keyboard.press('Enter')
  await expect(page.getByRole('alert')).toHaveCount(2)
})
