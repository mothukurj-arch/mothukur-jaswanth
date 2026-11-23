export interface SampleNote {
  id: string;
  label: string;
  content: string;
}

export const SAMPLE_NOTES: SampleNote[] = [
  {
    id: "photosynthesis",
    label: "Photosynthesis",
    content: `Photosynthesis is the biological process used by green plants, algae, and some bacteria to convert light energy into chemical energy stored in glucose. It takes place inside specialized cell organelles called chloroplasts, which contain the green pigment chlorophyll that absorbs sunlight—mainly blue and red wavelengths.

The process occurs in two main stages. First, the light-dependent reactions happen in the thylakoid membranes of the chloroplast. Light energy splits water molecules (H2O) into oxygen gas (O2), protons, and electrons, producing energy-carrier molecules called ATP and NADPH. Oxygen is released into the atmosphere as a byproduct through tiny leaf pores called stomata.

Second, the Calvin cycle (light-independent reactions) happens in the stroma, the fluid surrounding the thylakoids. Using ATP and NADPH from the first stage, enzymes fix carbon dioxide (CO2) from the air into three-carbon sugars, which cells combine to form glucose (C6H12O6). Plants use glucose both for immediate cellular respiration and to build starch and cellulose for growth.`,
  },
  {
    id: "french-revolution",
    label: "French Revolution",
    content: `The French Revolution (1789–1799) was a major political and social upheaval in France that ended absolute monarchy and reshaped modern Europe. Before 1789, French society was divided into three rigid social groups called Estates. The First Estate (clergy) and Second Estate (nobility) owned large amounts of land and paid almost no taxes, while the Third Estate—making up about 98% of the population, including peasants, urban workers, and the middle-class bourgeoisie—carried the entire tax burden.

Severe financial debt from France's involvement in costly wars, combined with poor harvests and rising bread prices in 1788, pushed ordinary people toward crisis. When King Louis XVI called the Estates-General in May 1789 to raise new taxes, the Third Estate broke away and formed the National Assembly, demanding a written constitution. On July 14, 1789, angry Parisians stormed the Bastille fortress, a symbol of royal tyranny.

Soon after, the National Assembly issued the Declaration of the Rights of Man and of the Citizen, stating that all citizens were born free and equal in rights. Later phases grew more radical, leading to the abolition of the monarchy in 1792, the execution of Louis XVI, and the Reign of Terror led by Maximilien Robespierre before Napoleon Bonaparte eventually seized power in 1799.`,
  },
  {
    id: "computer-memory",
    label: "Computer Memory",
    content: `Computer systems organize memory into a hierarchy that balances speed, storage capacity, and cost per byte. At the top of the hierarchy are CPU registers—tiny, ultra-fast storage locations inside the processor itself that hold operands and instructions currently being executed. Just below registers sits cache memory (L1, L2, and L3), built from static RAM (SRAM). Cache stores frequently accessed instructions and data so the CPU avoids waiting on slower main memory.

Main memory, commonly called RAM (Random Access Memory), uses dynamic RAM (DRAM) and provides several gigabytes of workspace for active operating system processes and open applications. Both cache and RAM are volatile memory, meaning their contents disappear as soon as electrical power is turned off.

At the base of the hierarchy is secondary storage, such as Solid-State Drives (SSDs) and Hard Disk Drives (HDDs). Secondary storage is non-volatile, retaining files, photos, and software permanently without power. When a program needs data that is not in RAM, the operating system transfers pages from secondary storage into RAM through a mechanism called virtual memory.`,
  },
];
