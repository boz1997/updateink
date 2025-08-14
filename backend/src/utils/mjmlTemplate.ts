export const MJML_TEMPLATE = `
<mjml>
  <mj-head>
    <mj-attributes>
      <mj-all font-family="Arial, Helvetica, sans-serif" color="#333333" />
      <mj-text font-size="14px" line-height="1.6" />
      <mj-section padding="0px" />
      <mj-column padding="0px" />
    </mj-attributes>
    <mj-style>
      .chip { border-radius:20px; padding:4px 10px; color:#ffffff; font-weight:700; font-size:12px; display:inline-block; }
      .chip.music { background:#e74c3c; }
      .chip.art { background:#9b59b6; }
      .chip.theatre { background:#f39c12; }
      .chip.sports { background:#27ae60; }
      .chip.festivals { background:#e67e22; }
      .chip.markets { background:#34495e; }
      .chip.food { background:#d35400; }
      .chip.other { background:#2e78c7; }
      .card { border-left:4px solid #2e78c7; background:#f8f9fa; border-radius:8px; }
      .sponsor { border-radius:8px; background:#ffffff; }
      .btn { background:#4a90e2; color:#ffffff; text-decoration:none; font-weight:700; padding:12px 20px; border-radius:6px; display:inline-block; }
      .news-link { color:#ff8c00; font-weight:700; text-decoration:none; }
      .muted { color:#666666; }
    </mj-style>
  </mj-head>
  <mj-body background-color="#f4f4f4">

    <!-- wrapper -->
    <mj-section padding="20px 0">
      <mj-column>
        <mj-wrapper padding="0" background-color="#ffffff" border-radius="12px" css-class="container">

          <!-- HERO (background image + overlay metin) -->
          <mj-hero mode="fluid-height" height="200px" background-width="600px" background-height="200px"
                   background-url="{{heroImageUrl}}" background-color="#1a1a1a">
            <mj-text align="left" color="#333333" font-weight="700" font-size="14px" padding="16px" background-color="#ffffff" border-radius="4px" css-class="header-logo">INK</mj-text>
            <mj-text color="#ffffff" font-size="20px" padding="0 30px">Good morning,</mj-text>
            <mj-text color="#ffffff" font-size="28px" font-weight="700" padding="0 30px">{{city}}!</mj-text>
            <mj-text color="#ffffff" font-size="16px" padding="0 30px">Here is today's <span style="color:#ffd700">update</span></mj-text>
          </mj-hero>

          <!-- Sponsors -->
          <mj-section padding="0" background-color="#e8f4fd">
            <mj-column>
              <mj-text align="center" padding="20px 25px" color="#4a90e2" font-size="18px">Powered by our trusted local partners</mj-text>
            </mj-column>
          </mj-section>
          <mj-section background-color="#e8f4fd" padding="0 20px 20px 20px">
            {{#each sponsors}}
            <mj-group>
              {{#each this}}
              <mj-column width="33.33%" padding="10px">
                <mj-section background-color="#ffffff" border-radius="8px" padding="15px" css-class="sponsor">
                  <mj-image src="{{logo}}" alt="{{name}}" width="50px" height="50px" padding="0 0 10px 0" />
                  <mj-text align="center" font-size="12px" class="muted">
                    <strong>{{name}}</strong><br/>{{tagline}}
                  </mj-text>
                </mj-section>
              </mj-column>
              {{/each}}
            </mj-group>
            {{/each}}
          </mj-section>

          <!-- Weather -->
          <mj-section padding="25px 20px 10px 20px" background-color="#ffffff" border-bottom="1px solid #eeeeee">
            <mj-column>
              <mj-table>
                <tr>
                  <td style="font-size:20px; font-weight:700; padding:0;">Today's Weather</td>
                  <td align="right" class="muted" style="font-size:14px;">{{date}}</td>
                </tr>
              </mj-table>
              <mj-spacer height="12px"/>
              <mj-table>
                <tr>
                  <td style="font-size:40px; padding-right:16px;">{{weather.icon}}</td>
                  <td>
                    <div style="font-size:22px; font-weight:700;">{{weather.condition}}</div>
                    <div class="muted" style="font-size:16px;">{{weather.detail}}</div>
                  </td>
                </tr>
              </mj-table>
            </mj-column>
          </mj-section>

          <!-- Today's Brief -->
          <mj-section padding="20px" background-color="#f8f9fa" border-bottom="1px solid #eeeeee">
            <mj-column>
              <mj-table>
                <tr>
                  <td style="font-size:20px; font-weight:700;">Today's Brief</td>
                  <td><div style="height:3px; background:linear-gradient(90deg,#4a90e2,transparent);"></div></td>
                </tr>
              </mj-table>
              {{#if todaysBrief.length}}
                {{#each todaysBrief}}
                  <mj-text padding="12px 0" font-size="16px"><span style="color:#ffa500; font-weight:700;">▶</span> {{this}}</mj-text>
                {{/each}}
              {{else}}
                <mj-text padding="12px 0" font-size="16px"><span style="color:#ffa500; font-weight:700;">▶</span> Check out today's weather and plan your outdoor activities accordingly.</mj-text>
              {{/if}}
            </mj-column>
          </mj-section>

          <!-- Ad / Promo -->
          <mj-section padding="30px 20px" background-color="#e8f4fd" border-bottom="1px solid #eeeeee">
            <mj-column>
              <mj-wrapper padding="0" background-color="#ffffff" border-radius="12px">
                <mj-text align="center" padding="20px 20px 10px 20px" font-size="18px">Discover Local Business</mj-text>
                <mj-text align="center" padding="0 25px 10px 25px" class="muted">Connect with trusted local partners</mj-text>
                <mj-text align="center" padding="0 25px 20px 25px" class="muted">From home services to professional consultations, find the best local businesses in {{city}}.</mj-text>
                <mj-button href="{{ad.ctaUrl}}" inner-padding="12px 24px" background-color="#4a90e2" color="#ffffff" font-weight="700" border-radius="6px">{{ad.ctaText}}</mj-button>
                <mj-spacer height="20px" />
              </mj-wrapper>
            </mj-column>
          </mj-section>

          <!-- News -->
          <mj-section padding="25px 20px 10px 20px" background-color="#ffffff">
            <mj-column>
              <mj-table>
                <tr>
                  <td style="font-size:20px; font-weight:700;">Local News</td>
                  <td><div style="height:3px; background:linear-gradient(90deg,#4a90e2,transparent);"></div></td>
                </tr>
              </mj-table>
              {{#if news.length}}
                {{#each news}}
                  <mj-wrapper padding="0 0 20px 0" css-class="card">
                    <mj-section padding="20px">
                      <mj-column>
                        <mj-text font-size="18px" font-weight="700">{{title}}</mj-text>
                        <mj-text class="muted">{{summary}}</mj-text>
                        <mj-text padding="10px 0 0 0">
                          <a class="news-link" href="{{link}}">Read more →</a>
                        </mj-text>
                      </mj-column>
                    </mj-section>
                  </mj-wrapper>
                {{/each}}
              {{else}}
                <mj-text class="muted">We're working to bring you the latest local news from {{city}}.</mj-text>
              {{/if}}
            </mj-column>
          </mj-section>

          <!-- Events -->
          {{#if events.length}}
          <mj-section padding="25px 20px" background-color="#f8f9fa">
            <mj-column>
              <mj-table>
                <tr>
                  <td style="font-size:20px; font-weight:700;">Local Events</td>
                  <td><div style="height:3px; background:linear-gradient(90deg,#4a90e2,transparent);"></div></td>
                </tr>
              </mj-table>
              {{#each events}}
                <mj-wrapper padding="0 0 15px 0" border-radius="12px" background-color="#ffffff" css-class="card" border-left="4px solid #2e78c7">
                  <mj-section padding="20px">
                    <mj-column>
                      <mj-text font-size="18px" font-weight="600">{{title}}</mj-text>
                      <mj-text>
                        <span class="chip {{categoryClass}}">{{category}}</span>
                      </mj-text>
                      <mj-text class="muted">📅 {{date}}</mj-text>
                      {{#if venue}}
                        <mj-text class="muted">📍 {{venue}}</mj-text>
                      {{/if}}
                    </mj-column>
                  </mj-section>
                </mj-wrapper>
              {{/each}}
            </mj-column>
          </mj-section>
          {{/if}}

          <!-- Sports -->
          {{#if sports.summary}}
          <mj-section padding="25px 20px" background-color="#ffffff">
            <mj-column>
              <mj-table>
                <tr>
                  <td style="font-size:20px; font-weight:700;">Sports Updates</td>
                  <td><div style="height:3px; background:linear-gradient(90deg,#4a90e2,transparent);"></div></td>
                </tr>
              </mj-table>
              <mj-wrapper padding="10px 0 20px 0" background-color="#f8f9fa" border-left="4px solid #27ae60" border-radius="12px">
                <mj-section padding="20px">
                  <mj-column>
                    <mj-text>{{sports.summary}}</mj-text>
                    {{#if sports.readMoreLink}}
                    <mj-text><a href="{{sports.readMoreLink}}" class="news-link">Read more ↗</a></mj-text>
                    {{/if}}
                  </mj-column>
                </mj-section>
              </mj-wrapper>

              {{#if sports.matches.length}}
              {{#each sports.matches}}
              <mj-wrapper padding="0 0 15px 0" background-color="#ffffff" border-left="3px solid #27ae60" border-radius="10px">
                <mj-section padding="15px" background-color="#ffffff">
                  <mj-column>
                    <mj-text font-size="11px" font-weight="700" color="#27ae60" text-transform="uppercase">{{sport}}</mj-text>
                    <mj-text font-size="15px" font-weight="600">{{title}}</mj-text>
                    {{#if teams}}
                      <mj-text class="muted">🏟️ {{teams}}</mj-text>
                    {{/if}}
                    <mj-text class="muted">📅 {{date}}</mj-text>
                    {{#if venue}}
                      <mj-text class="muted">📍 {{venue}}</mj-text>
                    {{/if}}
                  </mj-column>
                </mj-section>
              </mj-wrapper>
              {{/each}}
              {{else}}
                <mj-text class="muted" align="center">No upcoming matches found for {{city}}.</mj-text>
              {{/if}}

            </mj-column>
          </mj-section>
          {{/if}}

        </mj-wrapper>
      </mj-column>
    </mj-section>

  </mj-body>
</mjml>
`;
