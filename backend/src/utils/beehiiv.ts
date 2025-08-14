
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export interface CreateBeehiivPostParams {
  title: string;
  html?: string; // If provided, sent as body_content
  blocks?: any[]; // Alternatively provide Beehiiv-native blocks
  segmentIds?: string[]; // recipients.email.include_segment_ids
  status?: 'draft' | 'confirmed';
  scheduledAt?: string; // ISO date
  hideFromFeed?: boolean;
  emailSubject?: string;
  postTemplateId?: string; // Beehiiv post template id
}

export interface CreateBeehiivPostResult {
  success: boolean;
  postId?: string;
  response?: any;
  error?: string;
}

function getEnvOrThrow(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

export async function createBeehiivPost(params: CreateBeehiivPostParams): Promise<CreateBeehiivPostResult> {
  try {
    const apiKey = getEnvOrThrow('BEEHIIV_API_KEY');
    const publicationId = getEnvOrThrow('BEEHIIV_PUBLICATION_ID');

    if (!params.html && !params.blocks) {
      throw new Error('Either html or blocks must be provided');
    }

    const url = `https://api.beehiiv.com/v2/publications/${publicationId}/posts`;

    const body: any = {
      title: params.title,
      status: params.status || 'draft'  // Changed from 'confirmed' to 'draft'
    };

    if (params.html) {
      body.body_content = params.html;
    } else if (params.blocks) {
      body.blocks = params.blocks;
    }

    if (params.postTemplateId) {
      body.post_template_id = params.postTemplateId;
    }

    if (params.segmentIds && params.segmentIds.length > 0) {
      // Ensure segment IDs have the required 'seg_' prefix
      const formattedSegmentIds = params.segmentIds.map(id => 
        id.startsWith('seg_') ? id : `seg_${id}`
      );
      
      body.recipients = {
        email: {
          include_segment_ids: formattedSegmentIds
        },
        web: {
          include_segment_ids: formattedSegmentIds
        }
      };
    }

    if (params.emailSubject) {
      body.email_settings = {
        email_subject_line: params.emailSubject
      };
    }

    if (params.hideFromFeed !== undefined) {
      body.web_settings = {
        hide_from_feed: params.hideFromFeed,
        display_thumbnail_on_web: false
      };
    }

    const response = await axios.post(url, body, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 20000
    });

    console.log('🐝 Beehiiv API Response:', JSON.stringify(response.data, null, 2));

    return {
      success: true,
      postId: response.data?.data?.id,
      response: response.data
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.response?.data ? JSON.stringify(error.response.data) : error.message
    };
  }
}


