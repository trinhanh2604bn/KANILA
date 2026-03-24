const GuestSession = require("../models/guestSession.model");

const normalizeGuestSessionId = (value) => String(value || "").trim().slice(0, 128);

// POST /api/guest-sessions/bootstrap
const bootstrapGuestSession = async (req, res) => {
  try {
    const fromBody = req.body?.guestSessionId;
    const fromHeader = req.headers["x-guest-session-id"];
    let guestSessionId = normalizeGuestSessionId(fromBody || fromHeader);
    if (!guestSessionId) {
      guestSessionId = `gst_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    }

    let session = await GuestSession.findOne({ guest_session_id: guestSessionId });
    if (!session) {
      session = await GuestSession.create({
        guest_session_id: guestSessionId,
        status: "active",
        last_seen_at: new Date(),
        user_agent: String(req.headers["user-agent"] || ""),
      });
    } else {
      session.status = "active";
      session.last_seen_at = new Date();
      session.user_agent = String(req.headers["user-agent"] || session.user_agent || "");
      await session.save();
    }

    return res.status(200).json({
      success: true,
      message: "Guest session ready",
      data: {
        guestSessionId: session.guest_session_id,
        status: session.status,
        createdAt: session.created_at,
        lastSeenAt: session.last_seen_at,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { bootstrapGuestSession };
