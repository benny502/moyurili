import { Session } from 'inspector';
import { Context, Schema, h } from 'koishi'
import {} from 'koishi-plugin-cron'

export const name = 'moyurili'

export const usage = `
  <ul>
    <li><h3>定时任务功能依赖cron插件. 不使用定时功能可以不开启cron插件.</h3></li>
    <li><h3>频道为可选项，如果不输默认发送所有频道</h3></li>
    <li><h3>频道的格式为 {platformID}:{群号/频道ID}. 例: chronocat: 1234567, telegram: 123456, discord: 123456</h3></li>
    <li><h3>对应的platform与频道ID可以在数据库中查询. 可能需要数据库表channel中有对应的频道才能发送成功.</h3></li>
  </ul>
`;

export const inject = {
  optional: ['cron', 'database']
}

export interface Config {
  schedule: boolean,
  channel: Array<string>,
  hour: number,
  minute: number,
}

export const Config: Schema<Config> = Schema.object({
  schedule: Schema.boolean().default(false).description("是否开启定时任务"),
  channel: Schema.array(Schema.string()).description('频道'),
  hour: Schema.number().min(0).max(23).default(0).description("小时 0-23"),
  minute: Schema.number().min(0).max(59).default(0).description('分钟 0-59'),
})

const api = "https://api.vvhan.com/api/moyu?type=json";

type ApiResult = {
  success: Boolean,
  title: String,
  time: String,
  url: String,
} 

export function apply(ctx: Context, config: Config) {
  // write your plugin here


  if (config.schedule && ctx.cron && ctx.database) {
    ctx.cron(`${config.minute} ${config.hour} * * *`, async () => {
      const data = await getData(ctx);
      if (config.channel.length > 0) {
        await ctx.broadcast(config.channel, h("img", { src: data.url }));
      }else {
        await ctx.broadcast(h("img", { src: data.url }));
      }
    });
  }


  ctx.command("摸鱼日历").action(async ({ session }) => {
    try {
      const data = await getData(ctx);
      session.send(h("img", { src: data.url }));
    }catch(error) {
      console.log(error);
      session.send('出了点问题');
    }


  });
}

const getData = async (ctx) : Promise<ApiResult> => {
  const data = await ctx.http.get(api);
  console.log(data);
  return await data as ApiResult;
}
