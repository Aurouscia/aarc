<script setup lang="ts">
import { aboutName } from '../identities/routes/routesNames';


</script>

<template>
    <div class="sponsor">
        <h1>❤ 资助 AARC 开源项目 ❤</h1>
        <div class="section">
            <p>感谢大家对 AARC 的支持和喜爱，我是本项目的主要作者 Au，目前正在持续维护该项目。</p>
            <p>大家的反馈非常热情，也提出了大量非常优秀的改进建议，但请原谅——作者另有本职工作，业余精力实在有限，在优先级上难以取舍。如果你的建议被我答应，但搁置很久，请允许我表达最诚恳的歉意：我可能因为无法处理过多的建议而有所遗漏了。</p>
            <p>现开放项目赞助渠道，欢迎提供经济支持。</p>
        </div>
        <div class="section">
            <h2>你会得到什么？</h2>
            <p>为了表达感谢，我会：</p>
            <ol>
                <li>
                    优先开发和推进你需要的功能。你可以在留言处告诉我：
                    <ul style="margin-left: 20px;">
                        <li>想要电脑/手机能本地安装</li>
                        <li>想要XX市样式的站点/标签风格</li>
                        <li>想要矢量图svg导出（无限清晰度）</li>
                        <li>想要多人实时编辑</li>
                        <li>我的xx号存档用起来很卡</li>
                        <li>请完善xx功能/请修复xx问题</li>
                        <li>请制定规则整治社区xx乱象</li>
                        <li>...</li>
                    </ul>
                </li>
                <li>在项目源代码和网站上展示资助者名单（根据留言中填写的昵称）。</li>
            </ol>
        </div>
        <div class="section">
            <h2>你会失去什么？</h2>
            <p>你可以不资助，或者随时停止资助，而<b>不会失去任何东西</b>，因为 AARC 承诺的永久开源免费不会改变，你的“软件自由”是不可剥夺的。</p>
            <p>已有功能存在的严重问题修复依然是最高优先级，不会让位于新功能。</p>
            <p>上述“优先推进”的新功能会永久让所有用户受益，并非付费专属功能。</p>
            <p>依然欢迎向我提出建议，但请理解：可能需要排队。</p>
        </div>
        <div class="section">
            <h2>资金去向？</h2>
            <p>AARC 使用云服务器存储数万个存档数据，以及存档内用到的大量图片资源，便于平台用户合作与分享。</p>
            <p>云服务器需要不少租金，感谢你愿意与我分担平台运行开销。</p>
        </div>
        <div class="section">
            <h2>本地版的意义？</h2>
            <p>目前受限于项目结构，AARC 只有网页版，缺少本地版，用户需要庞大的工具链才能自己启动它</p>
            <p>
                这严重制约了用户行使“软件自由”，所以我会全力改造项目，让它能离线运行，实现：
                存档保存在本地（但支持存档云同步，避免丢失），程序本身可以以极低的门槛被任何人修改和分发。
                你可以自己（借助 AI）修改和添加功能，并自由选择是仅在自己的设备上使用还是把安装包分享给其他人，无需经过任何审核。
            </p>
            <p>实现了“本地版”承诺，AARC 才算完整的作品。</p>
        </div>
        <img src="/donate-au-wx.webp" class="qrcode"/>
        <div class="mobile-hint">电脑：请使用手机对准屏幕微信扫一扫</div>
        <div class="mobile-hint">手机：请长按保存并在微信扫一扫中打开相册</div>
        <div class="mobile-hint" style="color:black">为了便于联系，昵称请尽量填QQ昵称或aarc交流群中的群名片</div>
        <RouterLink :to="{name:aboutName}" class="linkBlock linkBlockMinor">关于本项目的信息</RouterLink>
    </div>
</template>

<style scoped lang="scss">
$theme-red: #c41e3a;

.sponsor {
    max-width: 720px;
    margin: 0 auto;
    padding: 40px 20px;
    color: #333;
    line-height: 1.7;

    h1 {
        text-align: center;
        font-size: 26px;
        margin-bottom: 24px;
        padding: 0;
        color: $theme-red;
        border-bottom: none;
        letter-spacing: normal;
    }

    h2 {
        font-size: 20px;
        margin-top: 0;
        margin-bottom: 12px;
        color: #444;
        border-left: 4px solid $theme-red;
        padding-left: 10px;
    }

    .mobile-hint{
        text-align: center;
        font-size: 14px;
        color: #999
    }

    .qrcode{
        display: block;
        margin: 10px auto;
        width: 200px;
        border-radius: 20px;
        box-shadow: 0px 0px 4px 0px #aaa;
        &:hover {
            box-shadow: 2px 4px 6px 0px #999;
        }
    }

    .linkBlock {
        display: block;
        text-align: center;
        width: 200px;
        margin: 28px auto;
        padding: 2px;
        border-radius: 6px;
        background-color: $theme-red;
        font-size: 17px;
        color: white;
        text-decoration: none;
        font-weight: bold;
        box-shadow: 0px 0px 4px 0px #aaa;
        &:hover {
            box-shadow: 2px 4px 6px 0px #999;
        }
        &.linkBlockMinor{
            background-color: #666;
        }
    }

    .section {
        margin-bottom: 28px;

        p {
            margin: 0 0 12px 0;
        }

        ol {
            margin: 0;
            padding-left: 24px;

            li {
                margin-bottom: 8px;
            }
        }
    }
}
</style>
