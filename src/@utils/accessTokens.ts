import { LoggerInstance } from '@oceanprotocol/lib'
// import { gql, OperationResult } from 'urql'
// import { fetchData, getQueryContext } from './subgraph'
import { OrdersData_orders as OrdersData } from 'src/@types/subgraph/OrdersData'
import { generateBaseQuery, getFilterTerm, queryMetadata } from './aquarius'
import axios, { CancelToken } from 'axios'

// const userDataQuery = gql`
//   query PermissionTokenQuery($user: String!) {
//     {
//       user(id: $user) {
//         id
//         totalOrders
//         orders(
//           orderBy: createdTimestamp
//           orderDirection: desc
//         ) {
//           id
//           datatoken {
//             id
//             name
//             minter
//             paymentCollector
//             nft {
//               address
//               name
//             }
//           }
//         }
//       }
//     }
//   }
// `

export async function getAccessTokens(
  dtList: string[],
  tokenOrders: OrdersData[],
  chainIds: number[],
  cancelToken: CancelToken,
  ignoreState = false
): Promise<AccessToken[]> {
  const baseQueryparams = {
    chainIds,
    filters: [
      getFilterTerm('services.datatokenAddress', dtList)
      // getFilterTerm('services.type', 'access')
    ],
    ignorePurgatory: true,
    ignoreState
  } as BaseQueryParams
  const query = generateBaseQuery(baseQueryparams)
  try {
    const result = await queryMetadata(query, cancelToken)
    const accessTokens: AccessToken[] = result.results
      .map((asset) => {
        const order = tokenOrders.find(
          ({ datatoken }) =>
            datatoken?.address.toLowerCase() ===
            asset.services[0].datatokenAddress.toLowerCase()
        )

        return {
          asset,
          networkId: asset.chainId,
          dtSymbol: order?.datatoken?.symbol,
          timestamp: order?.createdTimestamp
        }
      })
      .sort((a, b) => b.timestamp - a.timestamp)

    return accessTokens
  } catch (error) {
    if (axios.isCancel(error)) {
      LoggerInstance.log(error.message)
    } else {
      LoggerInstance.error('Error getting asset tokens: ', error.message)
    }
  }
}
