export const createDigitalCard = (gift, wedding, contributors) => {
  const contributorNames = contributors.map((contributor) => contributor.isAnonymous ? 'Anonymous' : contributor.name);
  const summary = `${gift.name} is a gift from ${contributorNames.join(', ')}`;
  const message = contributors.length > 1
    ? `${wedding.weddingName} is receiving a shared gift funded by ${contributorNames.join(', ')}.`
    : `${contributorNames[0]} gifted ${gift.name} to ${wedding.weddingName}.`;

  return JSON.stringify({
    title: `${gift.name} Completed!`,
    wedding: wedding.weddingName,
    giftName: gift.name,
    totalAmount: gift.totalPrice,
    contributors: contributorNames,
    message,
    summary,
    completedAt: new Date().toISOString()
  });
};
