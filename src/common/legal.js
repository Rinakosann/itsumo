// ============================================================
//  利用規約・プライバシーポリシー（旅行者＝英語版、事業者＝日本語版）
//  仕様書「利用規約・プライバシーポリシーの方針」にもとづくたたき台。
//  TODO: 運営者名・問い合わせ先は仮。公開・GitHubに上げる前に確認し、専門家にも見てもらう。
// ============================================================
import { OPERATOR } from '../../shared/constants.js';

const updated = '2026-10-16';

export const TERMS_EN = {
  title: 'Terms of Use',
  sections: [
    ['About this service', `ITSUMO connects travelers with small local shops in Japan. ITSUMO is an intermediary only: the experience, food and service at each shop are the responsibility of that shop. Operator: ${OPERATOR.nameEn}. Contact: ${OPERATOR.email}.`],
    ['Accounts', 'You need an account with your email and a password to chat with shops or book. Keep your password secret. You are responsible for activity on your account.'],
    ['Bookings and payment', 'A booking is confirmed immediately if the time slot has space. You pay the shop directly on the day (cash or card, as shown for each shop). ITSUMO does not take any payment.'],
    ['Cancellation', 'You can cancel for free until the start time. A shop may cancel your booking (for example, temporary closure or weather); the reason is shown in My bookings.'],
    ['Information on shop pages', 'Shop information, including the customer mix, years in business, distance from the main station and food information, is provided by each shop. We cannot guarantee it is accurate. Shop pages are published immediately and checked by us afterwards. If you have a serious allergy, confirm directly with the shop before visiting.'],
    ['Translation', 'Shop pages and chat messages are translated automatically and may contain mistakes. You can always see the original text.'],
    ['Prohibited behavior', 'Harassment, false bookings, spam, illegal content, and attempts to break or misuse the service are not allowed. We may suspend accounts that break these rules. Shops can block users who harass them.'],
    ['Deleting your account', 'You can delete your account at any time from Account. Please cancel future bookings first. After deletion you cannot log in with that account. You can register again with the same email, but past bookings and chats are not carried over.'],
    ['Changes', `We may update these terms. The latest version is always available here. Last updated: ${updated}.`],
  ],
};

export const PRIVACY_EN = {
  title: 'Privacy Policy',
  sections: [
    ['Who we are', `${OPERATOR.nameEn}. Contact: ${OPERATOR.email}.`],
    ['What we collect and why', [
      ['Email address', 'Login and password-reset emails', 'Shared with shops you book'],
      ['Name', 'Shown to shops in bookings and chat', 'Shared with the shop you book or chat with'],
      ['Password', 'Login. Stored only as a one-way hash; nobody can read it', 'Not shared'],
      ['Booking details (date, time, number of people)', 'To pass your booking to the shop', 'Shared with the shop you book'],
      ['Dietary needs', 'So the shop can prepare. This can relate to religion or health, so we only use it for your booking', 'Shared with the shop you book'],
      ['Messages and chat', 'Delivered to the other person. Sent to an external translation service to be translated', 'The other person, translation service'],
      ['Shop page views', 'To measure how the service is used (not linked to your name)', 'Not shared'],
    ]],
    ['Translation service', 'Your messages are sent to an external machine translation (or AI translation) service so that the shop can read them in Japanese.'],
    ['Security', 'We store data in a managed database, back it up regularly, and protect logins with hashed passwords and secure cookies.'],
    ['Your choices', 'You can change your name and currency, and delete your account, from Account. For other requests, contact us.'],
    ['Updates', `Last updated: ${updated}.`],
  ],
};

export const TERMS_JA = {
  title: '利用規約（事業者向け）',
  sections: [
    ['このサービスについて', `ITSUMOは、旅行者と地域の小さなお店をつなぐ仲介のサービスです。体験・料理・接客の内容そのものは、各事業者の責任とします。運営者：${OPERATOR.nameJa}。問い合わせ先：${OPERATOR.email}。`],
    ['アカウント', 'メールアドレスとパスワードで登録します。複数の端末から同じアカウントでログインできます。パスワードの管理はご自身でお願いします。'],
    ['店舗の掲載', '店舗は保存するとすぐに公開されます。運営は新しく公開された店舗と、旅行者からの報告を毎日確認し、事実と異なる・不適切と判断した掲載は非公開にすることがあります。客層・営業年数・主要駅からの距離・食べ物の情報は、事実にもとづいて正確に入力してください。'],
    ['予約', '時間枠の上限人数の範囲で、予約は即時に確定します。受付を止めたい日は「受付停止日」で設定してください。やむを得ずキャンセルする場合は、理由を選んでキャンセルできます（理由は英語に翻訳して旅行者に表示されます）。'],
    ['お支払い', '体験・飲食の代金は、当日お店で旅行者から直接受け取ってください。アプリ内での決済はありません。'],
    ['翻訳', '掲載文とチャットは自動で翻訳されます。翻訳には誤りが含まれることがあります。'],
    ['禁止事項', '虚偽の掲載、旅行者への嫌がらせ、法令に反する行為、サービスの運営を妨げる行為を禁止します。嫌がらせを受けたときは、チャットの相手をブロックできます。'],
    ['退会', '「アカウント」からいつでも退会できます。未来の予約がある場合は、先にキャンセルしてください。退会すると店舗は非公開になり、そのアカウントではログインできなくなります。同じメールアドレスで登録し直せますが、過去の予約とチャットは引き継がれません。'],
    ['変更', `この規約は変更することがあります。最新の版はいつでもここで確認できます。最終更新：${updated}`],
  ],
};

export const PRIVACY_JA = {
  title: 'プライバシーポリシー（事業者向け）',
  sections: [
    ['運営者', `${OPERATOR.nameJa}。問い合わせ先：${OPERATOR.email}`],
    ['集める情報と使い道', [
      ['メールアドレス', 'ログイン、パスワード再設定のメール', '渡しません'],
      ['お名前', '画面での表示', '渡しません'],
      ['パスワード', 'ログイン（元に戻せない形で保存）', '渡しません'],
      ['店舗の情報・掲載文', '旅行者への表示。英語に訳すため外部の翻訳サービスへ送ります', '旅行者、翻訳サービス'],
      ['チャット', '相手に届けるため。翻訳のため外部の翻訳サービスへ送ります', '旅行者、翻訳サービス'],
      ['詳細ページの閲覧記録', 'サービスの利用状況の集計（個人は特定しません）', '渡しません'],
    ]],
    ['旅行者の情報の取り扱い', '予約やチャットで受け取る旅行者の情報（お名前、メールアドレス、人数、食事制限、メッセージ）は、その予約・問い合わせへの対応のためだけに使ってください。食事制限は宗教や健康に関わることがあるため、慎重に取り扱ってください。'],
    ['安全管理', 'データは管理されたデータベースに保存し、定期的にバックアップします。パスワードは元に戻せない形で保存します。'],
    ['更新', `最終更新：${updated}`],
  ],
};

/** 規約を HTML にする（表は3列） */
export function legalHtml(doc, esc) {
  return `<h2>${esc(doc.title)}</h2>${doc.sections.map(([h, body]) => `
    <h4>${esc(h)}</h4>
    ${Array.isArray(body)
      ? `<div class="table-wrap"><table class="table">${body.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table></div>`
      : `<p>${esc(body)}</p>`}`).join('')}
    <p class="note">Draft — to be reviewed before official launch. / 公開前に確認するたたき台です。</p>`;
}
