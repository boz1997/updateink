export const MJML_TEMPLATE = `
<mjml>
  <mj-head>
  <mj-font name="Plus Jakarta Sans" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" />

    <mj-attributes>
      <!-- Use Plus Jakarta Sans globally with safe fallbacks -->
      <mj-all font-family="'Plus Jakarta Sans', Arial, Helvetica, sans-serif" />
      <mj-text font-size="16px" line-height="1.5" color="#2d2d2d" />
      <mj-section padding="0" />
      <mj-column padding="0" />
      <mj-image padding="0" />
      <mj-button background-color="#2e77c8" color="#ffffff" font-weight="700" inner-padding="10px 16px" border-radius="8px" />
    </mj-attributes>

    <mj-style >
      .container { background:white; }
      .muted { color:#6b7280; }
      .brand { color:#2e77c8; }
      .chip { display:inline-block; padding:2px 8px; font-size:14px; border-radius:9999px; background:#e8f1fd; color:#2e77c8; font-weight:600; }
      .card { background:#ffffff; border-radius:12px; }
      .event-card {background: #ffffff;border-radius: 12px;box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);overflow: hidden;width:90%}
      .evt-row:last-child td {border-bottom: none !important;}
      .city-title { color:#4A90E2; font-size:24px; font-weight:600; margin-top:5px; text-align:center; }
      .bullet-dot { width:8px; height:8px; border-radius:50%; background:#f59e0b; display:inline-block; margin-right:10px; }
      .list-table { width:100%; }
      .list-table td { padding:0px 0px; vertical-align:top; }
      .section-header { width:100%; }
      .news-title { font-weight:700; color:#1f2937; }
      .news-card { border:2px solid #F4B94240; border-radius:10px; padding:10px 10px;margin-bottom:5px; }
      .evt-row {  margin-bottom:10px; padding:8px 0px; }
      .evt-meta { color:#6b7280; }
      .sports-note { color:#334155; }
      .footer { background:#0f172a; color:#cbd5e1; }
      .footer a { color:#cbd5e1; text-decoration:none; }
      .right-cta a { text-decoration:none; color:#F4B942; font-weight:700; }
      .highlight { color:#F4B942; font-weight:700; }
      .s-name{font-weight:700;font-size:13px;color:#111827}
      .s-meta{font-size:12px;color:#6b7280} 
      .s-link{font-size:12px;color:#2563eb;text-decoration:none}
      .s-card{border:0px solid #e5e7eb;border-radius:12px;background-color="#f3f4f6"} 
      .s-pad{padding:0} 
      
      /* Beehiiv header'ını gizle */
      .beehiiv-header, 
      [data-beehiiv-header],
      .publication-header,
      .email-header,
      .newsletter-header,
      .beehiiv-publication-header,
      .header-wrapper,
      .publication-name,
      .publication-date { 
        display: none !important; 
        height: 0 !important; 
        overflow: hidden !important; 
      }
      
    </mj-style>
  </mj-head>

  <mj-body background-color="#ffffff" width="680px" css-class="container">
    <mj-wrapper padding="0">

      <!-- Top bar: logo + socials -->
      <mj-section background-color="#f3f4f6">
        <mj-column padding="0">
          <mj-table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td style="vertical-align:middle; width:50%;">
                <img src="https://i.imgur.com/19KTAbC.png" alt="Update Ink"
                    width="64" style="display:block; line-height:1; border:0; outline:none; text-decoration:none;" />
              </td>

              <td align="right" style="vertical-align:middle; width:50%;">
                <a href="#" style="display:inline-block; text-decoration:none;padding-left:10px">
                  <img src="https://i.imgur.com/yNGG390.png" width="24" height="24" alt="Facebook"
                      style="display:inline-block; border-radius:50%; border:0; outline:none; margin-left:6px;" />
                </a>
                <a href="#" style="display:inline-block; text-decoration:none;padding-left:10px">
                  <img src="https://i.imgur.com/wJwqTPS.png" width="24" height="24" alt="Instagram"
                      style="display:inline-block; border:0; outline:none; margin-left:6px;" />
                </a>
                <!-- Twitter/X icon hidden -->
                <!--
                <a href="#" style="display:inline-block; text-decoration:none;padding-left:10px">
                  <img src="https://i.imgur.com/4CjmGTy.png" width="24" height="24" alt="X"
                      style="display:inline-block; border:0; outline:none; margin-left:6px;" />
                </a>
                -->
              </td>
            </tr>
          </mj-table>
        </mj-column>
      </mj-section>


      <!-- HERO -->
      <mj-hero
        mode="fixed-height"
        height="220px"
        background-url="https://i.imgur.com/vxin6BM.png"
        background-position="center center"
        padding="0"
      >
        <mj-text
          align="left"
          color="#ffffff"
          font-family="'Plus Jakarta Sans', Arial, Helvetica, sans-serif"
          font-size="24px"
          font-weight="400"
          line-height="32px"
          padding="80px 32px 0"
        >
          Good morning,
        </mj-text>

        <mj-text
          align="left"
          color="#ffffff"
          font-family="'Plus Jakarta Sans', Arial, Helvetica, sans-serif"
          font-size="24px"
          font-weight="400"
          line-height="32px"
          padding="4px 32px 40px"
        >
          Here is today’s <span style="color:#F4B942; font-weight:600;">update</span>
        </mj-text>
      </mj-hero>


      <!-- Today in CITY -->
      <mj-section background-color="#f3f4f6" padding="25px 20px">
      <mj-column>
        <mj-text align="center" padding="0">
          <img src="https://i.imgur.com/YHlC0Ps.png" alt="Location Pin" width="40" height="20" style="vertical-align: middle; margin-right: 8px;" />
          <span class="city-title">Today in {{city}}</span>
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- Powered by -->
    <mj-section background-color="#f3f4f6" padding="8px 16px 16px">
      <mj-column>
        <mj-text align="center" padding="0">
          <span
            style="
              font-family:'Plus Jakarta Sans', Arial, Helvetica, sans-serif;
              font-size:24px;
              line-height:29px;
              font-weight:500;    
              font-style:italic;       
              color:#3E7DBB;                         
              display:inline-block;
            "
          >
            Powered by our trusted local partners
          </span>
        </mj-text>
      </mj-column>
    </mj-section>


      <!-- ===== Sponsors ===== -->
      {{#each sponsors}}
        <mj-section background-color="#f3f4f6" padding="0px 12px">
          <mj-group>
            {{#each this}}
              <mj-column width="33.33%">
                <mj-wrapper css-class="s-card" padding=2px>
                  <mj-text align="center" padding="12px 0 8px">
                    <img
                      src="{{logo}}"
                      alt="{{name}}"
                      width="72"
                      height="72"
                      style="display:block;margin:10px auto;"
                    />
                  </mj-text>
                  <mj-text align="center" css-class="s-pad">
                    {{#if website}}<div class="s-name"><a href="{{website}}" target="_blank" style="color:#111827; text-decoration:none; font-weight:700;">{{name}}</a></div>{{else}}<div class="s-name">{{name}}</div>{{/if}}
                    <div class="s-meta">Niche – {{tagline}}</div>
                    {{#if phone}}<div class="s-meta">{{phone}}</div>{{/if}}
                  </mj-text>
                </mj-wrapper>
              </mj-column>
            {{/each}}
          </mj-group>
        </mj-section>
      {{/each}}




      <!-- ===== Today's Weather ===== -->
      <mj-section padding="10px 0 " background-color="#f3f4f6" width="100%">
        <mj-column width="100%">
            <mj-image src="https://i.imgur.com/l7LPUFi.png" alt="Today's Weather" css-class="section-header" fluid-on-mobile="true"/>
        </mj-column>
      </mj-section>

      <mj-section background-color="#f3f4f6" css-class="card" padding="0px" width="100%">
        <mj-column>
          <mj-table css-class="list-table" width="100%" role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:26px;">
                {{#if weather.icon}}
                  <span style="font-size:18px;">{{weather.icon}}</span>
                {{else}}
                  <span class="bullet-dot"></span>
                {{/if}}
              </td>
              <td>
                <div><strong>{{weather.condition}}</strong> <span style="font-size:16px" class="muted">/ {{date}}</span></div>
                <div class="" style="margin-top:2px;font-size:16px">{{weather.detail}}</div>
              </td>
            </tr>
          </mj-table>
        </mj-column>
      </mj-section>

      <!-- ===== Today’s Brief ===== -->
      <mj-section padding="0px"  background-color="#f3f4f6">
        <mj-column width="100%">
            <mj-image src="https://i.imgur.com/rksPWUf.png" alt="Today's Brief" css-class="section-header" fluid-on-mobile="true" />
        </mj-column>
      </mj-section>

      <mj-section background-color="#f3f4f6" css-class="card" padding="0px" width="100%">
        <mj-column>
          <mj-table css-class="list-table" width="100%" role="presentation" cellpadding="0" cellspacing="0" style="padding:0px">
            {{#each todaysBrief}}
            <tr class="evt-row" >
              <td style="width:24px;padding:10px 0 12px 10px;">
                  <img src="https://i.imgur.com/PLjv0d8.png" alt="" width="24" />
              </td>
              <td style="font-size:16px;padding:10px 0 12px 10px;">{{this}}</td>
            </tr>
            {{/each}}
          </mj-table>
        </mj-column>
      </mj-section>

     <!-- ===== Membership Message / CTA ===== become a member -->
      <!-- COMMENTED OUT - İleride açılacak servis
      <mj-section background-color="#f3f4f6" border-radius="12px" padding="0" css-class="card">
        <mj-column>
          <mj-text align="center" font-size="24px" font-weight="700" padding="16px 16px 0">
            A message from the {{city}} <span class="brand">update</span>.
          </mj-text>

          <mj-image
            src="https://i.ibb.co/1f957v4h/Message.png"
            alt="Members make it possible"
            padding="6px 8px 10px"
            fluid-on-mobile="true" />

          <mj-button
            href="{{ad.ctaUrl}}"
            align="center"
            font-size="16px"
            inner-padding="14px 24px"
            border-radius="10px">
            Become a {{city}} update member
          </mj-button>
        </mj-column>
      </mj-section>
      -->


      <!-- ===== News ===== -->
      <mj-section padding="16px 0 0" background-color="#f3f4f6" width="100%">
        <mj-column width="100%">
            <mj-image src="https://i.imgur.com/cF1bMhy.png" alt="News" css-class="section-header" fluid-on-mobile="true"/>
        </mj-column>
      </mj-section>

      <mj-section background-color="#f3f4f6"  padding="0px 0px 0px" width="100%">
        <mj-column>
          {{#each news}}
            <mj-text>
              <div class="news-card">
                <div class="news-title">{{title}}</div>
                {{#if summary}}<div class="muted" style="margin-top:6px;">{{summary}}</div>{{/if}}
                <div class="right-cta" style="margin-top:6px;"><a href="{{link}}">Read more →</a></div>
              </div>
            </mj-text>
          {{/each}}
        </mj-column>
      </mj-section>

      <!-- ===== Events ===== -->
      <mj-section padding="16px 8px 0"  background-color="#f3f4f6">
        <mj-column width="100%">
            <mj-image src="https://i.imgur.com/D3b9gHB.png" alt="Events" css-class="section-header" fluid-on-mobile="true" />
        </mj-column>
      </mj-section>

      <mj-section background-color="#f3f4f6" padding="0px 0px 0px" width="90%">
        <mj-column>
          <mj-table css-class="list-table" width="90%" role="presentation" cellpadding="0" cellspacing="0">
            {{#each events}}
            <tr class="evt-row" style="margin-bottom:8px;">
              <td style="width:32px; vertical-align:top; padding:16px 12px 16px 0;">
                <span style="font-size:18px; line-height:1; display:inline-block;">{{icon}}</span>
              </td>
              <td style="padding-bottom:16px; padding-top:12px;  border-bottom:1px solid #D7E3FA;">
                <div><span class="chip" style="font-size:16px;">{{category}}</span> &nbsp; <strong style="font-size:16px;">{{#if link}}<a href="{{link}}" target="_blank" style="color:#2d2d2d; text-decoration:none;">{{title}}</a>{{else}}{{title}}{{/if}}</strong></div>
                <div class="evt-meta" style="font-size:16px;">{{date}}{{#if venue}} | {{venue}}{{/if}}</div>
              </td>
            </tr>
            {{/each}}
          </mj-table>
        </mj-column>
      </mj-section>

      <!-- ===== Sports ===== -->
      <mj-section padding="16px 8px 0"  background-color="#f3f4f6">
        <mj-column width="100%">
            <mj-image src="https://i.imgur.com/NWlRSyr.png" alt="Sports" css-class="section-header" fluid-on-mobile="true" />
        </mj-column>
      </mj-section>

      <mj-section background-color="#f3f4f6" padding="0px 0px 0px" width="100%">
        <mj-column>
          {{#if sports.summary}}
            <mj-text css-class="sports-note" style="font-size:16px;">{{{sports.summary}}}</mj-text>
          {{/if}}
          {{#if sports.readMoreLink}}
            <mj-text><a class="right-cta"style="color:#F4B942" href="{{sports.readMoreLink}}">Read more →</a></mj-text>
          {{/if}}

          {{#if sports.matches.length}}
          <mj-spacer height="8px" />
          <mj-table css-class="list-table" width="100%" role="presentation" cellpadding="0" cellspacing="0">
            {{#each sports.matches}}
            <tr class="evt-row">
              <td style="width:22px;">
                <span style="font-size:18px; line-height:1;">{{icon}}</span>
              </td>
              <td>
                <div><span class="chip">{{sport}}</span> &nbsp; <strong>{{title}}</strong></div>
                <div class="evt-meta">{{date}}{{#if venue}} | {{venue}}{{/if}}</div>
              </td>
            </tr>
            {{/each}}
          </mj-table>
          {{/if}}
        </mj-column>
      </mj-section>

      <!-- Footer -->
      <mj-section css-class="footer" background-color="#041220" padding="24px 16px">
        <mj-column>
          <mj-image src="https://i.imgur.com/SqgKs9t.png" alt="Update Ink" width="42px" align="center" />
          <mj-text align="center" color="#cbd5e1" padding="10px 0 0">Follow us for updates :</mj-text>
                   <mj-table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>

              <td align="middle" style="vertical-align:middle; width:50%;">
                <a href="#" style="display:inline-block; text-decoration:none;padding-left:0px">
                  <img src="https://i.imgur.com/yNGG390.png" width="24" height="24" alt="Facebook"
                      style="display:inline-block; border-radius:50%; border:0; outline:none; margin-left:6px;" />
                </a>
                <a href="#" style="display:inline-block; text-decoration:none;padding-left:10px">
                  <img src="https://i.imgur.com/wJwqTPS.png" width="24" height="24" alt="Instagram"
                      style="display:inline-block; border:0; outline:none; margin-left:6px;" />
                </a>
                <!-- Twitter/X icon hidden -->
                <!--
                <a href="#" style="display:inline-block; text-decoration:none;padding-left:10px">
                  <img src="https://i.ibb.co/3xsnRJy/twitter-x-white.png" width="24" height="24" alt="X"
                      style="display:inline-block; border:0; outline:none; margin-left:6px;" />
                </a>
                -->
              </td>
            </tr>
          </mj-table>
          <mj-text align="center" color="#94a3b8" padding="6px 0 0"><a href="{{assets.unsubscribeUrl}}">Unsubscribe</a></mj-text>
        </mj-column>
      </mj-section>

    </mj-wrapper>
  </mj-body>
</mjml>


`;
