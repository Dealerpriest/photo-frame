import { ref, computed } from 'vue';
// import { MediaItem } from './useGPhotos';

interface CountedItem<T> {
  timesPicked: number,
  item: T,
}

interface WeightedItem<T> {
  weight: number,
  timesPicked: number,
  item: T,
}

// TODO: Possibly separate pickinghistory with candidate space.
// That way, the history of items no longer in the candidate space would be preserved.

export function useWeightedDictionary<T> () {
  const dictionary = ref<Map<string, CountedItem<T>>>(new Map<string, CountedItem<T>>());
  const totalNrOfPicks = ref<number>(0);

  function setCandidateSpace (space: Map<string, T>) {
    dictionary.value.clear();

    space.forEach((item, key) => {
      const insertItem: CountedItem<T> = {
        timesPicked: 0,
        item: item,
      };
      dictionary.value.set(key, insertItem);
    });
  }

  function updateCandidateSpace (space: Map<string, T>) {
    space.forEach((item, key) => {
      const existingItem = dictionary.value.get(key);
      if (existingItem) {
        existingItem.item = item;
      } else {
        const newItem: CountedItem<T> = {
          timesPicked: 0,
          item: item,
        };
        dictionary.value.set(key, newItem);
      }
    });
  }

  function addItem (key: string, item: T) {
    if (dictionary.value.has(key)) {
      console.error('that key is already present in candidate space');
      return;
    }
    const insertItem: CountedItem<T> = {
      timesPicked: 0,
      item: item,
    };
    dictionary.value.set(key, insertItem);
  }

  // Gets an item without affecting the weights or probabilities
  function getItem (key: string) {
    const existingItem = dictionary.value.get(key);
    if (!existingItem) {
      throw Error('no such item in candidate space');
    }
    return existingItem.item;
  }

  function pickItem (key: string): T {
    // let insertItem: CountedItem<T> = {
    //   timesPicked: 0,
    //   item: item,
    // };
    const existingItem = dictionary.value.get(key);
    if (!existingItem) {
      throw Error('no such item in candidate space');
      // existingItem.weight++;
      // existingItem.item = item;
      // insertItem = existingItem;
      // dictionary.value.set(key, existingItem);
    }
    // else {
    //   // dictionary.value.set(key, item);
    // }
    existingItem.timesPicked++;
    // existingItem.item = item;

    dictionary.value.set(key, existingItem);
    totalNrOfPicks.value++;
    return existingItem.item;
  }

  const weightedDictionary = computed<Map<string, WeightedItem<T>>>(() => {
    const weigthedMap = new Map<string, WeightedItem<T>>();
    // const divider = dictionary.value.size * totalNrOfPicks.value;
    // const divider = totalNrOfPicks.value === 0 ? 1 : totalNrOfPicks.value;
    if (!dictionary.value.size) {
      return weigthedMap;
    }
    const divider = (dictionary.value.size - 1) * totalNrOfPicks.value;
    // if (!totalNrOfPicks.value || totalNrOfPicks.value === 0) {
    //   console.error('Fuck you! divider is invalid');
    //   throw Error('invalid weighted dictionary');
    // }
    dictionary.value.forEach((countedItem, key) => {
      let weight = 0;
      if (!totalNrOfPicks.value) {
        weight = 1 / dictionary.value.size;
      } else {
        weight = (totalNrOfPicks.value - countedItem.timesPicked) / divider;
      }
      const weightedItem: WeightedItem<T> = {
        item: countedItem.item,
        timesPicked: countedItem.timesPicked,
        weight: weight,
      };
      weigthedMap.set(key, weightedItem);
    });
    return weigthedMap;
  });

  const totalWeight = computed(() => {
    let accumulator = 0;
    weightedDictionary.value.forEach((weightedItem) => {
      accumulator += weightedItem.weight;
    });
    return accumulator;
  });

  function getRandomItem () {
    let randNum = Math.random();
    // const values = weightedDictionary.value.entries();
    for (const [key, item] of weightedDictionary.value.entries()) {
      randNum -= item.weight;
      if (randNum <= 0) {
        return pickItem(key);
      }
    }

    throw Error('mega error in random picker function');
    // for(i = 0; i < weightedDictionary.value.size; i++){
    //   const item = values.next();
    //   randNum -= item.value.
    // }
  }
  return { weightedDictionary, getRandomItem, getItem, addItem, setCandidateSpace, updateCandidateSpace, totalWeight };
}
