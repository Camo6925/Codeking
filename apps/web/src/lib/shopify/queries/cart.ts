export const CART_QUERY = `
  query Cart($cartId: ID!) {
    cart(id: $cartId) {
      id
      checkoutUrl
      totalQuantity
      lines(first: 100) {
        edges {
          node {
            id
            quantity
            merchandise {
              ... on ProductVariant {
                id
                title
                price { amount currencyCode }
                compareAtPrice { amount currencyCode }
                product {
                  title
                  handle
                  images(first: 1) { edges { node { url altText } } }
                }
              }
            }
          }
        }
      }
      cost {
        subtotalAmount { amount currencyCode }
        totalTaxAmount { amount currencyCode }
        totalAmount { amount currencyCode }
      }
    }
  }
`
