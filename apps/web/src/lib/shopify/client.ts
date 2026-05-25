// Shopify Storefront API GraphQL client — browser-safe (uses public token)

const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!
const API_VERSION = '2024-01'

interface GraphQLResponse<T> {
  data: T
  errors?: Array<{ message: string }>
}

export async function storefrontFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
  tags?: string[]
): Promise<T> {
  const res = await fetch(
    `https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
      next: { tags },
    }
  )

  if (!res.ok) {
    throw new Error(`Shopify Storefront API error: ${res.status} ${res.statusText}`)
  }

  const json = (await res.json()) as GraphQLResponse<T>

  if (json.errors?.length) {
    throw new Error(`Shopify GraphQL errors: ${json.errors.map((e) => e.message).join(', ')}`)
  }

  return json.data
}
