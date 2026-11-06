// Daily.co Video Call Integration Service
export const DAILY_API_KEY = '4a72db54ed89e9e60048d32476437ab1ed620c0a5bca1611f89a07257c019413';
export const DAILY_DOMAIN = 'mathstutor.daily.co';
export const DEFAULT_ROOM_NAME = 'mathstutor';
export const DEFAULT_ROOM_URL = `https://${DAILY_DOMAIN}/${DEFAULT_ROOM_NAME}`;

/**
 * Creates a meeting token for joining a private/protected Daily.co room
 */
export async function createDailyMeetingToken(roomName = DEFAULT_ROOM_NAME, userName = 'Ninja Tutor', isOwner = false) {
  try {
    const res = await fetch('https://api.daily.co/v1/meeting-tokens', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          room_name: roomName,
          user_name: userName,
          is_owner: isOwner,
          enable_screenshare: true,
          start_video_off: false,
          start_audio_off: false,
          exp: Math.floor(Date.now() / 1000) + 7200, // Valid for 2 hours
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn('Daily token generation warning:', err);
      return null;
    }

    const data = await res.json();
    return data.token;
  } catch (error) {
    console.error('Error generating Daily meeting token:', error);
    return null;
  }
}

/**
 * Creates a new Daily.co room for 1-on-1 session
 */
export async function createDailyRoom(roomName, privacy = 'public') {
  try {
    const sanitizedName = (roomName || `tutoring-${Date.now().toString(36)}`)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-');

    const res = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: sanitizedName,
        privacy,
        properties: {
          exp: Math.floor(Date.now() / 1000) + 14400, // 4 hours
          enable_chat: true,
          enable_screenshare: true,
          eject_at_room_exp: true,
        },
      }),
    });

    if (!res.ok) {
      // If room already exists, fetch it
      const getRes = await fetch(`https://api.daily.co/v1/rooms/${sanitizedName}`, {
        headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
      });
      if (getRes.ok) {
        return await getRes.json();
      }
      throw new Error(`Failed to create room: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Error creating Daily room:', error);
    return {
      name: DEFAULT_ROOM_NAME,
      url: DEFAULT_ROOM_URL,
    };
  }
}
