import { getKFC } from '@/utils'

export default async function (ctx: FunctionContext) {
  return {
    data: await getKFC(),
  }
}
