import { ref, unref, computed, toRaw } from 'vue';
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

export function useWeightedDictionary<T> () {
  const dictionary = ref<Map<string, CountedItem<T>>>(new Map<string, CountedItem<T>>());
  // const totalNrOfPicks = ref<number>(0);

  function resetWeightedDictionary () {
    localStorage.removeItem('dictionary');
    dictionary.value = new Map<string, CountedItem<T>>();
  }

  function saveToStorage () {
    const unReactiveDict = unref(dictionary);
    const dictAsArray = Array.from(unReactiveDict.entries());
    const stringified = JSON.stringify(dictAsArray);
    console.log(stringified);
    localStorage.setItem('dictionary', stringified);
  }
  function loadFromStorage () {
    const stringFromStorage: string | null = localStorage.getItem('dictionary');
    if (stringFromStorage !== null) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const parsedDict = JSON.parse(stringFromStorage) as Array<[string, CountedItem<T>]>;
      const constructedMap = new Map(parsedDict);
      dictionary.value = constructedMap;
      // setCandidateSpace(constructedMap);
    } else {
      console.error('no dictionary saved in storage!');
    }
  }

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
    const constructedDict: typeof dictionary.value = new Map();

    // Go through all injected items
    // if an item already was in the current dict, update only the item (not number of picks)
    // if want previously in dict, create a new item
    // insert the updated or created item into a new clean dict
    // assign the new dict to dictionary

    space.forEach((item, key) => {
      const existingItem = dictionary.value.get(key);
      if (existingItem) {
        existingItem.item = item;
        constructedDict.set(key, existingItem);
      } else {
        const newItem: CountedItem<T> = {
          timesPicked: 0,
          item: item,
        };
        constructedDict.set(key, newItem);
      }
    });
    console.log('candidate space after update', dictionary.value);
    dictionary.value = constructedDict;
    saveToStorage();
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
    return toRaw(existingItem.item);
  }

  function pickItem (key: string): T {
    const existingItem = dictionary.value.get(key);
    if (!existingItem) {
      throw Error('no such item in candidate space');
    }
    existingItem.timesPicked++;

    dictionary.value.set(key, existingItem);
    // totalNrOfPicks.value++;
    return toRaw(existingItem.item);
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

  const totalNrOfPicks = computed(() => {
    let accumulator = 0;
    dictionary.value.forEach((countedItem) => {
      accumulator += countedItem.timesPicked;
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

  return { weightedDictionary, saveToStorage, loadFromStorage, resetWeightedDictionary, getRandomItem, getItem, addItem, setCandidateSpace, updateCandidateSpace, totalWeight, totalNrOfPicks };
}
