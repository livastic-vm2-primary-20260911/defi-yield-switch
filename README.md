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

## Local-only calculation

User enters hypothetical USD principal, current and destination base/reward APY, reward haircut, gas, bridge/swap/exit costs, slippage bps, earning delay, withdrawal lock and decision horizon.

The calculator models annual *simple* APY, not compounding:

- Stay: \`principal * currentAssumedAPY * horizonDays / 36500\`
- Move: \`principal * targetAssumedAPY * max(0,horizonDays-delayDays) / 36500 - totalCosts\`
- Difference: move minus stay.
- \`totalCosts = gas + bridge + swap + oldExit + futureExit + principal * slippageBps / 10000\`.
- If the APY spread is positive, costs are recovered after \`ceil((36500*costs/principal + targetApy*delayDays)/(targetApy-currentApy))\` days; otherwise no finite fee break-even under these assumptions.

Rate haircuts are *user-entered* hypotheses. No live vault data, oracle data, wallet addresses, keys, cookies, tracking or network fetch. The site's Content Security Policy has \`connect-src 'none'\`. Calculated JSON is downloaded only after clicking the button, excludes user wallet addresses and never uploads.

This is not a strategy recommendation, yield forecast, safety certification, financial advice or tax advice. Exit liquidity, smart-contract loss, collateral liquidation, stablecoin depeg, reward token pricing and protocol restrictions can dwarf the modeled small yield advantage. The operator does not audit protocols. **Do not transfer any crypto based only on this model**.

[DefiLlama Yields](https://defillama.com/yields) is a useful external source; according to its [official API docs](https://api-docs.defillama.com/), the free yield API stops on 13 Nov 2026. This site deliberately has NO dependency on the deprecated endpoint.

## Real-world user feedback intake (optional; not a sale)

The standalone EN /feedback/ and KO /ko/feedback/ forms ask what calculation is missing, approximate frequency, nonbinding willingness to pay (including **0 USDC / free**), and at most 260 characters of optional **fictional** inputs. No account, blockchain-wallet connect, actual balance, txhash, address, customer CSV, legal name, required email, identity, or keys. Forms use browser-native required consent and only after a user clicks Submit do they POST to the separately operated **FormSubmit** service, which may process sender metadata, send normal CAPTCHA/human challenge, and deliver to the single owner's already-existing mail address. We do not turn off anti-spam or auto-submit.

Explicit independent GitHub issue and mailto alternatives remain available. The optional one-minute form is NOT the calculator; the calculator remains connect-src none, local-only and free. Provider redirect /feedback/thanks/ is noindex,nofollow; it is not proof of inbox delivery. As at launch **real completed feedback submissions, conversion and paying customers = 0 verified**. Do not confuse a real form's existence, operator's own tests, or willingness option labels with a third-party user's affirmative response.

## Optional one-owner service and support

An opt-in \`mailto:\` request for a **fixed-scope 15 native Circle USDC on Base** AI-assisted one-page fee/exit assumptions evidence review is only an inquiry; separate scope, delivery, price acceptance and actual payment must occur before paid work begins. The service does NOT choose investments or promise rewards. There are presently **ZERO** independently verified orders of this service.

The public existing same-beneficial-owner VM5 Base USDC receive-only address is included on the site solely for optional tips. An arbitrary onchain deposit is NOT proof of a paid custom report or another x402 API purchase. Never put recovery phrases, customer transactions or identity documents into public issues or email.

Owner scope: VM2 product/source and inquiry; VM5 publicly operates that one-owner wallet and existing x402 merchant; VM1, VM3, VM5 already own their separate user/revenue lanes. Historic actual owner gross Base native Circle USDC from **four unrelated finalized transfers = 1.020000** (not earned here); VM2 Hugo human-approved **1.070000 Base Circle USDC UNPAID**. Net-after-costs unknown.

Owner express 2026-10-19 STOP of raw Golem/AIOZ/DePIN/CPU/GPU/VPS compute rental or substitution remains binding.

## Test and publication

\`\`\`bash
npm test
python3 -m http.server 8766 --bind 127.0.0.1
\`\`\`

Then visit the local root and \`/ko/\`; no npm dependencies. The bundled read-only GitHub Actions runner uses pinned upstream action SHA versions and only runs \`npm test\`. Static HTML, JS and CSS plus \`.nojekyll\` can be served from GitHub Pages main branch root.

## License

MIT © 2026 Workflow Guard, disclosed AI-assisted original implementation. The calculations and example scenarios are original; public cited community statements are external references, not copyrighted training examples included in code.
