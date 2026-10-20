# DeFi Yield Switch — fee break-even, not APY hype

**Working public tool (after actual owner GitHub Pages publication):**
https://livastic-vm2-primary-20260911.github.io/defi-yield-switch/
Korean: https://livastic-vm2-primary-20260911.github.io/defi-yield-switch/ko/

An entirely browser-local, no-wallet, no-account APY/fee sensitivity calculator. It helps a DeFi user test a specific question: **does the extra quoted APY pay back all the costs of changing a stablecoin lending/vault/LP position, before the position needs to be liquid again?**

## What people have genuinely asked about

- [r/defi users](https://www.reddit.com/r/defi/comments/1wvsxvf/defi_stablecoin_platforms/) asked how to compare fragmented USDC/EURC stablecoin yields, vault curators, incentive APYs and complexity without making monitoring a full-time job (2 Oct 2026).
- [r/defi users](https://www.reddit.com/r/defi/comments/1s84fa6/how_do_you_guys_reduce_rebalancing_costs_when/) reported concentrated-liquidity rebalance transaction costs eating expected trading fees (30 Mar 2026).
- [An ETH holder](https://www.reddit.com/r/ethtrader/comments/1vej4aj/my_eth_position_looked_green_until_i_counted/) reported missing gas, bridging and price impact from headline wallet PnL estimates (3 Aug 2026).

These are **public demand signals**, not proof that this new tool has paid customers, referrals, meaningful traffic, or that anybody is willing to pay for our research.

## Actual independent user pain addressed in the v0.1.1 reserve check

In an [independent r/defi discussion about a hypothetical $10,000 USDC emergency cash reserve](https://www.reddit.com/r/defi/comments/1vtfy6n/if_you_kept_10000_in_stablecoins_as_a_cash/), unrelated commenters explicitly distinguish **cash accessible on the day it is needed** from a locked investment. That is genuine problem context, **not evidence anyone used or paid for our product**. We did not contact, impersonate, or solicit any participant or reuse their actual wallet information.

The optional (unchecked by default) **'I must access this emergency cash reserve on demand'** box never connects a wallet. When a hypothetical bridge/cooldown takes days, or the destination vault has an assumed lockup, it **FAILS the user's instant-access constraint** regardless of whether the modeled 90-day yield advantage is positive. When the inputs assume zero delay and zero lock, the result says **real stress-time redemption remains UNKNOWN**. Withdrawal conditions, market utilization, ability to redeem at par, stablecoin pegs, chain finality, and smart-contract pause controls must be confirmed from authoritative protocol sources. The checkbox is not a yes/no safety certification, yield recommendation or actual risk score.

We also corrected the withdrawableUnderAssumedLock calculation to count the **total time until possible target exit as bridge/cooldown delay + post-deposit lockup**, rather than just the latter. The numeric yield break-even formula is unchanged and is still a simplified, hypothetical simple-annual-interest comparison. See tests/reserve-liquidity.test.mjs for eight extra independently reproducible fail-closed cases. The tool does not know actual reserve eligibility or a person's finances.

## Why the small-position example matters

A real public July 14, 2026 DeFi operations post [The Rebalance That Keeps Almost Happening](https://dev.to/carter_may_96736e7b35986c/the-rebalance-that-keeps-almost-happening-12-days-watching-morpho-outperform-2f20) reported a $20.04 Moonwell position, 4.77% versus 7.30% APY, and about $0.50 round-trip gas. It **overstated the 30-day incremental yield by exactly 10×** ($0.417 versus approximately **$0.041672**): the gas bill is roughly **1,200%** of the month-one extra yield, not 119%. At those *July 2026* simplified, static rates, just recovering gas takes about **360 days**; satisfying a guard that gas be below **10%** of the additional yield would need roughly **3,600 days**. The post's conclusion to not rebalance remains directionally sound.

The new EN/KO **Small $20 fee trap** button inserts a *fictional* variant of these public hypothetical numbers (zero rewards, no move delay, no lockup) so anyone can reproduce the arithmetic locally. Regression tests fix the percentage-point/decimal conversion boundary. It is **not** a statement of current Moonwell/Morpho yields, an endorsement by the article author, a recorded real user of this product, or proof that a DeFi investment is safe. An original DEV reply with that correction was drafted but the **native DEV Submit click was browser-actionability blocked before dispatch**. It was NOT publicly posted and was not retried through another tool, account, or VM.

## Local-only calculation

User enters hypothetical USD principal, current and destination base/reward APY, reward haircut, ordinary gas, separate token approval/allowance adjustment/revocation gas, bridge/swap/exit costs, slippage bps, earning delay, withdrawal lock and decision horizon.

The calculator models annual *simple* APY, not compounding:

- Stay: \`principal * currentAssumedAPY * horizonDays / 36500\`
- Move: \`principal * targetAssumedAPY * max(0,horizonDays-delayDays) / 36500 - totalCosts\`
- Difference: move minus stay.
- \`totalCosts = ordinaryGas + approvalsAndRevocationsGas + bridge + swap + oldExit + futureExit + principal * slippageBps / 10000\`.
- If the APY spread is positive, costs are recovered after \`ceil((36500*costs/principal + targetApy*delayDays)/(targetApy-currentApy))\` days; otherwise no finite fee break-even under these assumptions.

Rate haircuts are *user-entered* hypotheses. No live vault data, oracle data, wallet addresses, keys, cookies, tracking or network fetch. The site's Content Security Policy has \`connect-src 'none'\`. Calculated JSON is downloaded only after clicking the button, excludes user wallet addresses and never uploads.

**A practical cost often missed: ERC-20 approval and revoke transactions.** For a standalone readable walkthrough in English and Korean, see /allowance-gas/ and /ko/allowance-gas/ on the public tool website.  A publicly documented October 2026 DeFi user explicitly pointed out that a small swap may require a broad token allowance and later gas to revoke it (source: https://www.reddit.com/r/defi/comments/1x77646/what_frustrated_you_most_when_using_defi/). The input \`allowanceLifecycleUsd\` is the user's total expected EXTRA approval, allowance adjustment and later revoke gas in USD (default $0), explicitly EXCLUDING fees already included in ordinary \`gasUsd\` to avoid double-counting. Adding $5 to $10 other costs on a fictional $1,000 position with +5pp annualized yield moves modeled break-even from 73 to **110 days**. **Critical:** the model does NOT inspect allowances, verify spenders, revoke approvals or assess unlimited allowance exploitation risk. It never asks you to connect a wallet. Check actual token allowances and spender contracts independently before signing.

This is not a strategy recommendation, yield forecast, safety certification, financial advice or tax advice. Exit liquidity, smart-contract loss, collateral liquidation, stablecoin depeg, reward token pricing and protocol restrictions can dwarf the modeled small yield advantage. The operator does not audit protocols. **Do not transfer any crypto based only on this model**.

[DefiLlama Yields](https://defillama.com/yields) is a useful external source; according to its [official API docs](https://api-docs.defillama.com/), the free yield API stops on 13 Nov 2026. This site deliberately has NO dependency on the deprecated endpoint.

## Real-world user feedback intake (optional; not a sale)

The standalone EN /feedback/ and KO /ko/feedback/ forms ask what calculation is missing, approximate frequency, nonbinding willingness to pay (including **0 USDC / free**), and at most 260 characters of optional **fictional** inputs. No account, blockchain-wallet connect, actual balance, txhash, address, customer CSV, legal name, required email, identity, or keys. Forms use browser-native required consent, fixed URL/origin-only referrer so the provider can recognize the hosted web form, and only after a user clicks Submit do they POST to the separately operated **FormSubmit** service, which may process sender metadata, send normal CAPTCHA/human challenge, and deliver to the single owner's already-existing mail address. We do not turn off anti-spam or auto-submit.

Explicit independent GitHub issue and mailto alternatives remain available. The optional one-minute form is NOT the calculator; the calculator remains connect-src none, local-only and free. Provider redirect /feedback/thanks/ is noindex,nofollow; it is not proof of inbox delivery. As at launch **real completed feedback submissions, conversion and paying customers = 0 verified**. Do not confuse a real form's existence, operator's own tests, or willingness option labels with a third-party user's affirmative response.

## Optional one-owner service and support

An opt-in \`mailto:\` request for a **fixed-scope 15 native Circle USDC on Base** AI-assisted one-page fee/exit assumptions evidence review is only an inquiry; separate scope, delivery, price acceptance and actual payment must occur before paid work begins. The service does NOT choose investments or promise rewards. There are presently **ZERO** independently verified orders of this service.

The public existing same-beneficial-owner VM5 Base USDC receive-only address is included on the site solely for optional tips. An arbitrary onchain deposit is NOT proof of a paid custom report or another x402 API purchase. Never put recovery phrases, customer transactions or identity documents into public issues or email.

Owner scope: VM2 product/source and inquiry; VM5 publicly operates that one-owner wallet and existing x402 merchant; VM1, VM3, VM5 already own their separate user/revenue lanes. Historic actual owner gross Base native Circle USDC from **four unrelated finalized transfers = 1.020000** (not earned here); VM2 Hugo human-approved **1.070000 Base Circle USDC UNPAID**. Net-after-costs unknown.

Owner express 2026-10-19 STOP of raw Golem/AIOZ/DePIN/CPU/GPU/VPS compute rental or substitution remains binding.

## Direct paid-scope request conversion (buyer-initiated; NO prepayment)

The original free tool still works without submitting anything. Separate EN /quote/ and Korean /ko/quote/ landing pages are fully static native browser forms for a potential, individually agreed **15 native Circle USDC (Base) approximately one-page technical evidence note**, not investment advice. Inputs: reply email (only to coordinate the request), two PUBLIC official vault/protocol document URLs, ONE hypothetical/public technical question, non-binding preference for a 15 USDC scoped report or 0/free, and a separately unchecked mandatory FormSubmit data-transfer consent. No actual balance, address, seed, private transaction, ID document, wallet connection, signing, gas or payment is requested. The native browser forms deliberately use the standard Referrer-Policy strict-origin-when-cross-origin (the already activated original VM2 SignScope native FormSubmit pattern) and a fixed hidden _url with the public form URL: FormSubmit requires a valid web origin to process requests. They previously used no-referrer, and two synthetic owner-only native form attempts on 2026-10-20 returned "Unable to submit form" before and after the first origin-only change; neither test is a real customer inquiry or evidence of email delivery. This revised policy copies the previously confirmed original SignScope activation configuration; external buyer email delivery must be independently verified. A THIRD and final carefully labeled **OWNER ONLY synthetic browser submission** after aligning with the already activated SignScope pattern reached FormSubmit **Almost There / normal reCAPTCHA**. A bounded read-only browser POST network capture observed both genuine Origin and Referer headers and HTTP 200, rather than the previous missing-referrer rejection. We did NOT solve/disable/bypass CAPTCHA; no final redirect or inbox email was verified, so this is **provider acceptance pending normal human verification, NOT a buyer conversion or delivery confirmation**. The human customer can use the direct email link as an alternative if the provider challenge fails. The origin-only cross-site policy sends only the HTTPS scheme/host, never any buyer form field value in the Referer; the HTML POST still intentionally sends buyer-entered fields to FormSubmit after checkbox consent. The third-party FormSubmit service may process sender metadata, and a normal human verification may be required. Sender identity and report permission must be verified before accepting. A request/redirect isn't a purchase, settlement or signed service contract. The corresponding /quote/thanks/ routes are noindex and do NOT claim delivery. The operator must separately agree price, permitted AI use, owner legal status, scope, license/IP, acceptance, cancellation/refund and lawful Base-USDC payment **before** collecting money or delivering bespoke work. Real unrelated gross USDC receipts and separately approved unpaid bounties are not payments of this service.

## Test and publication

\`\`\`bash
npm test
python3 -m http.server 8766 --bind 127.0.0.1
\`\`\`

Then visit the local root and \`/ko/\`; no npm dependencies. The bundled read-only GitHub Actions runner uses pinned upstream action SHA versions and only runs \`npm test\`. Static HTML, JS and CSS plus \`.nojekyll\` can be served from GitHub Pages main branch root.

## License

MIT © 2026 Workflow Guard, disclosed AI-assisted original implementation. The calculations and example scenarios are original; public cited community statements are external references, not copyrighted training examples included in code.
