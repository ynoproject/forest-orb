let badgeTools;

function initBadgeTools() {
  const { createApp } = Vue;

  const tag = {
    template: '#tagTemplate',
    props: [ 'index' ],
    data() {
      return {
        tagId: null,
        map: 0,
        mapCoords: false,
        mapX1: 0,
        mapY1: 0,
        mapX2: 0,
        mapY2: 0,
        switchMode: '',
        switchId: 0,
        switchValue: false,
        switchIds: [],
        switchValues: [],
        switchDelay: false,
        varMode: '',
        varId: 0,
        varValue: 0,
        varValue2: 0,
        varOp: '=',
        varIds: [],
        varValues: [],
        varOps: [],
        varDelay: false,
        varTrigger: false,
        trigger: '',
        value: '',
        values: [],
        timeTrial: false
      }
    },
    computed: {
     switchModeOptions() {
        return [
          { key: '', label: 'None' },
          { key: 'switch', label: 'Switch' },
          { key: 'switches', label: 'Switch List' }
        ];
      },
      varModeOptions() {
        return [
          { key: '', label: 'None' },
          { key: 'var', label: 'Variable' },
          { key: 'vars', label: 'Variable List' }
        ];
      },
      varOpOptions() {
        const ret = [ '=', '<', '>', '<=', '>=', '!=' ];
        if (this.varMode === 'var')
          ret.push('>=<');
        return ret;
      },
      triggerOptions() {
        return [
          { key: '', label: 'Default' },
          { key: 'prevMap', label: 'Previous Map ID' },
          { key: 'teleport', label: 'Teleport' },
          { key: 'coords', label: 'Coordinates' },
          { key: 'picture', label: 'Picture' },
          { key: 'event', label: 'Event Collision' },
          { key: 'eventAction', label: 'Event Interaction' }
        ];
      },
      hasTriggerValue() {
        switch (this.trigger) {
          case 'prevMap':
          case 'picture':
          case 'event':
          case 'eventAction':
            return true;
        }
        return false;
      },
      triggerValueName() {
        switch (this.trigger) {
          case 'prevMap':
            return 'Previous Map ID';
          case 'picture':
            return 'Picture ID';
          case 'event':
          case 'eventAction':
            return 'Event ID';
        }
        return 'Value';
      }
    },
    methods: {
      addSwitch() {
        if (this.switchMode === 'switches') {
          this.switchIds.push(0);
          this.switchValues.push(false);
        }
      },
      addVar() {
        if (this.varMode === 'vars') {
          this.varIds.push(0);
          this.varValues.push(0);
          this.varOps.push('=');
        }
      }
    },
    watch: {
      mapCoords(newVal, _oldVal) {
        if (!newVal) {
          this.mapX1 = 0;
          this.mapY1 = 0;
          this.mapX2 = 0;
          this.mapY2 = 0;
        }
      },
      switchMode(newMode, oldMode) {
        switch (newMode) {
          case 'switches':
            this.addSwitch();
            break;
        }
        switch (oldMode) {
          case 'switches':
            this.switchIds = [];
            this.switchValues = [];
            break;
        }
      },
      varMode(newMode, oldMode) {
        switch (newMode) {
          case 'vars':
            this.addVar();
            break;
        }
        switch (oldMode) {
          case 'vars':
            this.varIds = [];
            this.varValues = [];
            break;
        }
      },
      trigger(newVal, _oldVal) {
        if (newVal === 'teleport' || newVal === 'coords')
          this.mapCoords = true;
      }
    },
    mounted() {
      this.mapId = this.$parent.map;
    },
    updated() {
      switch (this.$parent.reqType) {
        case 'tag':
          this.$parent.reqString = this.tagId;
          break;
        case 'tags':
          this.$parent.reqStrings[this.index] = this.tagId;
          break;
      }
      this.$parent.tags[this.index] = this;
    }
  };

  const badge = {
    template: '#badgeTemplate',
    components: { tag },
    props: [ 'index' ],
    data() {
      return {
        badgeId: '',
        gameId: null,
        group: null,
        order: 0,
        mapOrder: 0,
        name: 'New Badge',
        description: null,
        condition: null,
        art: null,
        animated: false,
        bp: 10,
        reqType: 'tag',
        reqInt: null,
        reqString: null,
        reqStrings: [],
        reqCount: 0,
        map: 0,
        secret: false,
        secretMap: false,
        secretCondition: false,
        hidden: false,
        parent: null,
        overlay: false,
        overlayTypeGradient: false,
        overlayTypeMultiply: false,
        overlayTypeMask: false,
        overlayTypeDual: false,
        overlayTypeLocation: false,
        batch: 0,
        dev: false,

        tagIndex: 0,
        tags: []
      }
    },
    computed: {
      gameName() {
        return this.gameId ? this.gameOptions.find(g => g.key === this.gameId).label : '';
      },
      gameOptions() {
        return [ 'ynoproject' ].concat(gameIds).map(g => { return { key: g, label: this.$root.localizedMessages?.games[g] || g } });
      },
      groupOptions() {
        if (this.gameId === '2kki') {
          return [
            { key: '2_el', label: 'Events and Locations' },
            { key: '3_tt', label: 'Time Trials' },
            { key: '4_ch', label: 'Challenges' },
            { key: '5_end', label: 'End Game' }
          ];
        }
        return [];
      },
      overlayType() {
        let ret = 0;
        if (this.overlay) {
          if (this.overlayTypeGradient)
            ret |= BadgeOverlayType.GRADIENT;
          if (this.overlayTypeMultiply)
            ret |= BadgeOverlayType.MULTIPLY;
          if (this.overlayTypeMask)
            ret |= BadgeOverlayType.MASK;
          if (this.overlayTypeDual)
            ret |= BadgeOverlayType.DUAL;
          if (this.overlayTypeLocation)
            ret |= BadgeOverlayType.LOCATION;
        }

        return ret;
      }
    },
    methods: {
      addTag() {
        let tagIndex;
        switch (this.reqType) {
          case 'tag':
            tagIndex = 0;
            this.reqString = '';
            this.tags.push({ index: 0 });
            break;
          case 'tags':
            tagIndex = this.reqStrings.length;
            this.reqStrings.push('');
            this.tags.push({ index: tagIndex });
            break;
        }
      }
    },
    watch: {
      gameId(newId, _oldId) {
        if (newId === '2kki') {
          const groupOptions = this.groupOptions;
          if (groupOptions.length)
            this.group = groupOptions[0].key;
        } else
          this.group = null;
      },
      reqType(newType, oldType) {
        this.tags = [];
        switch (oldType) {
          case 'tag':
            this.reqString = null;
            break;
          case 'tags':
            this.tagIndex = 0;
            this.reqStrings = [];
            break;
        }
        if (newType)
          this.addTag();
      }
    },
    mounted() {
      this.gameId = gameId;
      this.addTag();
    },
    updated() {
      this.$root.badges[this.index] = this;
    }
  };

  badgeTools = createApp({
    components: { badge },
    data() {
      return {
        localizedMessages: null,
        badgeIndex: 0,
        badges: []
      }
    },
    methods: {
      addBadge() {
        const badgeIndex = this.badges.length;
        this.badges.push({ index: badgeIndex });
      },
      exportZip() {
        const zip = new JSZip();

        const badgesFolder = zip.folder('badges');
        const badgesGameFolders = {};

        const conditionsFolder = zip.folder('conditions');
        const conditionsGameFolders = {};

        const badges = this.badges;

        for (let badge of badges) {
          if (!badge.badgeId)
            continue;

          badge.bp = parseInt(badge.bp);

          let badgeGameFolder;
          if (!badgesGameFolders.hasOwnProperty(badge.gameId))
            badgesGameFolders[badge.gameId] = badgesFolder.folder(badge.gameId);
          badgeGameFolder = badgesGameFolders[badge.gameId];

          const badgeObj = {};

          const badgeMergeProps = [
            'order',
            'group',
            'mapOrder',
            'bp',
            'reqType',
            'reqInt',
            'reqString',
            'reqStrings',
            'reqCount',
            'map',
            'secret',
            'secretMap',
            'secretCondition',
            'hidden',
            'parent',
            'overlayType',
            'art',
            'animated',
            'batch',
            'dev'
          ];

          for (let prop of badgeMergeProps)
            merge(badge, badgeObj, prop);
            
          badgeGameFolder.file(`${badge.badgeId}.json`, JSON.stringify(badgeObj, null, 2));

          if (badge.tags.length) {
            let tagsGameFolder;
            if (!conditionsGameFolders.hasOwnProperty(badge.gameId))
              conditionsGameFolders[badge.gameId] = conditionsFolder.folder(badge.gameId);
            tagsGameFolder = conditionsGameFolders[badge.gameId];

            for (let tag of badge.tags) {
              if (!tag.tagId)
                continue;

              const tagObj = {};

              const tagMergeProps = [
                'map',
                'mapX1',
                'mapY1',
                'mapX2',
                'mapY2',
                'switchId',
                'switchValue',
                'switchIds',
                'switchValues',
                'switchDelay',
                'varId',
                'varValue',
                'varValue2',
                'varOp',
                'varIds',
                'varValues',
                'varOps',
                'varDelay',
                'varTrigger',
                'trigger',
                'value',
                'values',
                'timeTrial'
              ];

              for (let prop of tagMergeProps)
                merge(tag, tagObj, prop);

              tagsGameFolder.file(`${tag.tagId}.json`, JSON.stringify(tagObj, null, 2));
            }
          }
        }

        const langFolder = zip.folder('lang');

        const languages = Array.from(document.getElementById('lang').children).map(o => o.value);
        const fetchLangFiles = languages.map(lang => {
          return fetchNewest(`lang/badge/${lang}.json`)
            .then(response => response.json())
            .then(jsonResponse => {
              const localizedGameBadges = jsonResponse;
              for (let badge of badges) {
                if (!badge.badgeId || !badge.name)
                  continue;

                const localizedBadge = {};
                merge(badge, localizedBadge, 'name');
                merge(badge, localizedBadge, 'description');
                merge(badge, localizedBadge, 'condition');
                localizedGameBadges[badge.gameId][badge.badgeId] = localizedBadge;
              }
              langFolder.file(`${lang}.json`, JSON.stringify(localizedGameBadges, null, 2));
            });
        });
        Promise.allSettled(fetchLangFiles).then(() => zip.generateAsync({ type: 'base64' }).then(base64 => location.href = `data:application/zip;base64,${base64}`));
      }
    },
    mounted() {
      this.addBadge();
    }
  });
  
  badgeTools.mount('#badgeToolsForm');
}

function merge(source, target, prop) {
  if (source[prop] && (!Array.isArray(source[prop]) || source[prop].length))
    target[prop] = source[prop];
}