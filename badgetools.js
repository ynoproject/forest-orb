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
        timeTrial: false,

        deleted: false
      };
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
      },
      deleteTag() {
        let index = this.index;
        const tags = this.$parent.tags;
        tags[index].deleted = true;
        while (index < tags.length - 1 && tags[++index].deleted);
        if (tags[index].deleted) {
          index = this.index;
          while (index && tags[--index].deleted);
        }
        this.$parent.tagIndex = index;
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
      this.$parent.tags[this.index] = this;
    },
    updated() {
      this.$parent.tags[this.index] = this;
      this.$root.save();
    }
  };

  const badge = {
    template: '#badgeTemplate',
    props: [ 'index' ],
    components: { tag },
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
        reqType: null,
        reqInt: null,
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
        tags: [],
        deleted: false
      };
    },
    computed: {
      gameName() {
        return this.gameId ? this.gameOptions.find(g => g.key === this.gameId).label : '';
      },
      gameOptions() {
        return [ 'ynoproject' ].concat(gameIds).map(g => { return { key: g, label: this.$root.localizedMessages?.games[g] || g } });
      },
      groupOptions() {
        if (this.gameId === 'ynoproject') {
          return [
            { key: '1_badge', label: 'Badges' },
            { key: '2_exp', label: 'Expeditions' },
            { key: '3_rank', label: 'Rankings' },
            { key: '4_spec', label: 'Special' }
          ];
        }
        if (this.gameId === '2kki') {
          return [
            { key: '0_loc', label: 'Exploration' },
            { key: '1_exp', label: 'Expeditions' },
            { key: '2_el', label: 'Events and Locations' },
            { key: '3_tt', label: 'Time Trials <a href="javascript:void(0);" class="helpLink iconLink" data-i18n="[title]modal.settings.fields.timeTrialinfo.helpText"> <div class="helpIcon icon fillIcon invertFillIcon altIcon"> <svg viewBox="0 0 18 18"> <path d="m9 0a1 1 90 0 0 0 18 1 1 90 0 0 0-18m-1.25 10.25a1 1 90 0 0 2.5 0.5q0.25-1 1.25-1.5c0.75-0.5 2.5-1.5 2.5-3.75 0-4-7.75-5.5-9.5-0.5a0.25 0.25 90 0 0 2.75 0.5c0.25-1.75 4-2.25 3.75 0.5 0 1.5-3 2.25-3.25 4.25m1.25 6a0.25 0.25 90 0 0 0-3.25 0.25 0.25 90 0 0 0 3.25" /> </svg> </div> </a>' },
            { key: '4_ch', label: 'Challenges' },
            { key: '5_end', label: 'End Game' }
          ];
        }
        if (this.gameId === 'unconscious') {
          return [
            { key: '2_el', label: 'Events and Locations' },
            { key: '3_tt', label: 'Time Trials' },
            { key: '4_ch', label: 'Challenges' }
          ];
        }
        return [];
      },
      reqString() {
        if (this.reqType !== 'tag' || !this.tags.length)
          return null;
        return this.tags[0].tagId;
      },
      reqStrings() {
        if (this.reqType !== 'tags')
          return null;
        return this.tags.filter(t => !t.deleted).map(t => t.tagId);
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
        let newTag = null;
        switch (this.reqType) {
          case 'tag':
            newTag = { deleted: false };
            break;
          case 'tags':
            const tagIndex = this.tags.length;
            newTag = { deleted: false };
            if (this.$root.initialized)
              this.tagIndex = tagIndex;
            break;
        }

        this.tags.push(newTag);
      },
      deleteBadge() {
        while (this.$root.badgeIndex > 1 && this.$root.badges[--this.$root.badgeIndex].deleted);
        this.$root.badges[this.index].deleted = true;
      }
    },
    watch: {
      gameId(newId, _oldId) {
        if (newId === '2kki') {
          const groupOptions = this.groupOptions;
          if (groupOptions.length)
            this.group = groupOptions[2].key;
        } else
			if (newId === 'ynoproject' || newId === 'unconscious') {
				const groupOptions = this.groupOptions;
				if (groupOptions.length)
					this.group = groupOptions[0].key;
        } else
          this.group = null;
      },
      reqType(newType, oldType) {
        this.tags = [];
        if (oldType === 'tags')
          this.tagIndex = 0;
        if (newType)
          this.addTag();
      }
    },
    mounted() {
      this.gameId = gameId;
      this.reqType = 'tag';
      this.$root.badges[this.index] = this;
    },
    updated() {
      this.$root.badges[this.index] = this;
      this.$root.save();
    }
  };

  badgeTools = createApp({
    components: { badge },
    data() {
      return {
        initialized: false,
        saveQueued: false,
        localizedMessages: null,
        badgeIndex: 0,
        badges: []
      }
    },
    methods: {
      addBadge() {
        const badgeIndex = this.badges.length;
        const newBadge = { deleted: false };
        this.badges.push(newBadge);
        if (this.initialized)
          this.badgeIndex = badgeIndex;
      },
      getBadgeData() {
        const badges = [];

        if (this.badges.length) {
          let badgeDataKeys;
          let tagDataKeys;

          for (let badge of this.badges) {
            if (!badge?.$data || badge.deleted)
              continue;
            if (!badgeDataKeys)
              badgeDataKeys = Object.keys(badge.$data);
            const badgeObj = {};
            for (let badgeKey of badgeDataKeys) {
              switch (badgeKey) {
                case 'tags':
                  badgeObj.tags = [];
                  for (let tag of badge.tags) {
                    if (!tag?.$data || tag.deleted)
                      continue;
                    if (!tagDataKeys)
                      tagDataKeys = Object.keys(tag.$data);
                    const tagObj = {};
                    for (let tagKey of tagDataKeys) {
                      switch (tagKey) {
                        case 'varOp':
                          merge(tag, tagObj, tagKey, op => op === '=');
                          break;
                        case 'varOps':
                          merge(tag, tagObj, tagKey, ops => !ops.filter(op => op !== '='));
                          break;
                        default:
                          merge(tag, tagObj, tagKey);
                          break;
                      }
                    }
                    badgeObj.tags.push(tagObj);
                  }
                  break;
                case 'tagIndex':
                  break;
                default:
                  merge(badge, badgeObj, badgeKey);
                  break;
              }
            }
            badges.push(badgeObj);
          }
        }

        return badges;
      },
      save() {
        if (!this.initialized || this.saveQueued)
          return;
        this.saveQueued = true;
        const self = this;
        Vue.nextTick(() => {
          globalConfig.badgeToolsData = this.getBadgeData();
          updateConfig(globalConfig, true);
          self.saveQueued = false;
        });
      },
      exportZip() {
        const zip = new JSZip();

        const badgesFolder = zip.folder('badges');
        const badgesGameFolders = {};

        const conditionsFolder = zip.folder('conditions');
        const conditionsGameFolders = {};

        const badges = this.badges;

        for (let badge of badges) {
          if (!badge.badgeId || badge.deleted)
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
              if (!tag.tagId || tag.deleted)
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

              for (let prop of tagMergeProps) {
                switch (prop) {
                  case 'varOp':
                    merge(tag, tagObj, prop, op => op === '=');
                    break;
                  case 'varOps':
                    merge(tag, tagObj, prop, ops => !ops.filter(op => op !== '='));
                    break;
                  default:
                    merge(tag, tagObj, prop);
                    break;
                }
              }

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
                if (!localizedGameBadges[badge.gameId])
                  localizedGameBadges[badge.gameId] = {};
                localizedGameBadges[badge.gameId][badge.badgeId] = localizedBadge;
              }
              langFolder.file(`${lang}.json`, JSON.stringify(localizedGameBadges, null, 2));
            });
        });
        Promise.allSettled(fetchLangFiles).then(() => zip.generateAsync({ type: 'blob' }).then(blob => saveAs(blob, 'badges.zip')));
      }
    },
    mounted() {
      const self = this;
      if (globalConfig.badgeToolsData) {
        const badges = this.badges;

        for (let badgeData of globalConfig.badgeToolsData) {
          badgeData = Object.assign({}, badgeData);
          const tagsData = badgeData.tags;
          if (tagsData)
            delete badgeData.tags;

          const badgeIndex = badges.length;
          this.addBadge();

          Vue.nextTick(() => {
            const badge = badges[badgeIndex];

            for (let prop of Object.keys(badgeData)) {
              if (badgeData.hasOwnProperty(prop))
                badge[prop] = badgeData[prop];
            }

            Vue.nextTick(() => {
              if (tagsData) {
                for (let t = 0; t < tagsData.length; t++) {
                  const tagData = tagsData[t];
                  const tagIndex = t;
                  if (t)
                    badge.addTag();

                  Vue.nextTick(() => {
                    const tag = badge.tags[tagIndex];

                    for (let prop of Object.keys(tagData)) {
                      if (tagData.hasOwnProperty(prop))
                        tag[prop] = tagData[prop];
                    }
                  });
                }
              }
            });
          });
        }
      } else
        this.addBadge(true);
      setTimeout(() => self.initialized = true, 500);
    }
  });
  
  badgeTools.mount('#badgeToolsForm');
}

function merge(source, target, prop, defaultFunc) {
  if (source[prop] && (!Array.isArray(source[prop]) || source[prop].length) && (!defaultFunc || !defaultFunc(source[prop])))
    target[prop] = source[prop];
}
