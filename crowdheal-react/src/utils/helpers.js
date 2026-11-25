/** Format a number as Indian Rupee (INR) currency string */
export function money(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

/** Clamp a percentage between 0 and 100 */
export function percent(raised, goal) {
  if (!goal) return 0;
  return Math.min(Math.round((raised / goal) * 100), 100);
}

/** Load all user-published campaigns from localStorage */
export function getLocalCampaigns() {
  try {
    const data = JSON.parse(localStorage.getItem('crowdhealCampaigns') || '[]');
    return Array.isArray(data) ? data : [];
  } catch (_) {
    return [];
  }
}

/** Save campaigns array to localStorage */
export function saveLocalCampaigns(campaigns) {
  localStorage.setItem('crowdhealCampaigns', JSON.stringify(campaigns));
}

/** Load donations map from localStorage */
export function getDonations() {
  try {
    const data = JSON.parse(localStorage.getItem('crowdhealDonations') || '{}');
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  } catch (_) {
    return {};
  }
}

/** Save donations map to localStorage */
export function saveDonations(donations) {
  localStorage.setItem('crowdhealDonations', JSON.stringify(donations));
}

/** Campaigns created before review existed stay public. New ones must be approved. */
export function isPublicCampaign(campaign) {
  return !campaign?.status || campaign.status === 'approved';
}

export function campaignStatus(campaign) {
  if (campaign?.status === 'pending' || campaign?.status === 'rejected' || campaign?.status === 'approved') {
    return campaign.status;
  }
  return 'approved';
}

/** Accept or reject a fundraiser request. */
export function reviewCampaign(id, status, note = '') {
  if (status !== 'approved' && status !== 'rejected') {
    throw new Error('Choose accept or reject.');
  }
  const saved = getLocalCampaigns();
  const index = saved.findIndex(c => c.id === id);
  if (index < 0) throw new Error('Campaign no longer exists.');
  saved[index] = {
    ...saved[index],
    status,
    reviewNote: String(note || '').trim(),
    reviewedAt: new Date().toISOString(),
  };
  saveLocalCampaigns(saved);
  return saved[index];
}

/** Merge seeded campaigns with approved fundraiser campaigns and apply stored donations. */
export function getAllCampaigns(seedCampaigns) {
  const merged = seedCampaigns.map(c => ({ ...c }));
  getLocalCampaigns().forEach(item => {
    if (!isPublicCampaign(item)) return;
    if (!merged.some(c => c.id === item.id)) merged.push({ ...item });
  });
  const donations = getDonations();
  return merged.map(c => {
    const extra = donations[c.id];
    if (!extra) return c;
    return {
      ...c,
      raised: (Number(c.raised) || 0) + (Number(extra.amount) || 0),
      donors: (Number(c.donors) || 0) + (Number(extra.donors) || 0),
    };
  });
}
