# Changelog

All notable changes to the [bpmn.io vs-code extension](https://github.com/bpmn-io/vs-code-bpmn-io) will be documented here. We use [semantic versioning](http://semver.org/) for releases.

## Unreleased Changes

___Note:__ Yet to be released changes appear here._

## 0.21.0

* `DEPS`: update dependency bpmn-js to v17

## 0.20.0

* `DEPS`: update dependency bpmn-js to v16

## 0.19.0

* `FEAT`: add ability to color BPMN elements ([#93](https://github.com/bpmn-io/vs-code-bpmn-io/issues/93), [#145](https://github.com/bpmn-io/vs-code-bpmn-io/pull/145))

## 0.18.1

_Re-release of v0.18.0 due to incorrect version in [package.json](./package.json)._

## 0.18.0

* `DEPS`: update dependency bpmn-js to v15

## 0.17.0

* `DEPS`: update dependency bpmn-js to v14

## 0.16.1

* `DOCS`: update documentation

## 0.16.0

* `FEAT`: turn into custom editor ([#67](https://github.com/bpmn-io/vs-code-bpmn-io/issues/67), [#62](https://github.com/bpmn-io/vs-code-bpmn-io/issues/62), [#99](https://github.com/bpmn-io/vs-code-bpmn-io/issues/99))
* `FEAT`: make menu save actions work ([#88](https://github.com/bpmn-io/vs-code-bpmn-io/issues/88))
* `FEAT`: make dirty indicator work ([#48](https://github.com/bpmn-io/vs-code-bpmn-io/issues/48))
* `FEAT`: handle external file changes ([#18](https://github.com/bpmn-io/vs-code-bpmn-io/issues/18))

## 0.15.4

_Republish of `v0.15.3`._

## 0.15.3

* `FIX`: correctly bundle dependencies

## 0.15.2

_Republish of `v0.15.1`._

## 0.15.1

* `CHORE`: improve package meta-data

## 0.15.0

* `FEAT`: update to `bpmn-js@13.2.0`
* `FEAT`: open initial diagram if empty file ([#116](https://github.com/bpmn-io/vs-code-bpmn-io/pull/116))

## 0.14.0

* `FIX`: escape single quotes before import ([#108](https://github.com/bpmn-io/vs-code-bpmn-io/issues/108))
* `FIX`: properly log import errors ([`be7ec4`](https://github.com/bpmn-io/vs-code-bpmn-io/commit/be7ec4b0717adb03314a50a70c847e04d71170b8))
* `DEPS`: bump to bpmn-js@10.2.0

## 0.13.0

* `FEAT`: display save button in editor ([#97](https://github.com/bpmn-io/vs-code-bpmn-io/pull/97))
* `FEAT`: support collapsed sub processes
* `FIX`: display correct editor icons
* `DEPS`: bump to bpmn-js@9.0.3

## 0.12.0

* `CHORE`: update display name + description ([#95](https://github.com/bpmn-io/vs-code-bpmn-io/pull/95))

## 0.11.0

* `CHORE`: bump to bpmn-js@8.3.0

## 0.10.0

* `FEAT`: add support for .bpmn2 files ([#78](https://github.com/bpmn-io/vs-code-bpmn-io/issues/78))
* `CHORE`: upgrade to bpmn-js@8
## 0.9.0

* `FEAT`: add action keybindings ([#61](https://github.com/bpmn-io/vs-code-bpmn-io/issues/61))
* `FIX`: use active editor if not opened directly ([#76](https://github.com/bpmn-io/vs-code-bpmn-io/issues/76))
* `FIX`: use local document path for file contents ([#82](https://github.com/bpmn-io/vs-code-bpmn-io/issues/82))
* `CHORE`: ensure build tools are working on all platforms ([`3f5fa066`](https://github.com/bpmn-io/vs-code-bpmn-io/commit/3f5fa0666e0cdfe400c4cd9746ea03be11bb7458))

## 0.8.0

* `FEAT`: adapt autosave capabilities on focus and window change ([`0c3fd1`](https://github.com/bpmn-io/vs-code-bpmn-io/commit/0c3fd1cbe200773d3454b98f22fe9183bce2927e))
* `FEAT`: use webview related uri for resource generation  ([#70](https://github.com/bpmn-io/vs-code-bpmn-io/issues/70))
* `CHORE`: upgrade to bpmn-js@7
* `CHORE`: update bpmn-io logo ([#72](https://github.com/bpmn-io/vs-code-bpmn-io/issues/72))

## 0.7.0

* `FIX`: correct copy, paste and replace
* `CHORE`: drop readonly BPMN viewer
* `CHORE`: bump to `bpmn-js@6.3.1`

## 0.6.4

* `CHORE`: correct repository url

## 0.6.3

* `CHORE`: add marketplace logo to package metadata

## 0.6.2

* `CHORE`: add marketplace logo

## 0.6.1

* `FIX`: bundle css files ([`2f85fc`](https://github.com/pinussilvestrus/vs-code-bpmn-io/commit/2f85fc939a7fba3c356755436faadecaf9611934))

## 0.6.0

* `FEAT(editing)`: save diagram changes on CTRL+S ([`#46`](https://github.com/pinussilvestrus/vs-code-bpmn-io/issues/46))
* `CHORE`: improve icons
* `FEAT`: add `editing` capabilities ([#2](https://github.com/pinussilvestrus/vs-code-bpmn-io/issues/2))
* `FIX`: add support for Windows ([#44](https://github.com/pinussilvestrus/vs-code-bpmn-io/issues/44))

## 0.5.0

* `CHORE`: remove jquery from preview panel ([`819422`](https://github.com/pinussilvestrus/vs-code-bpmn-io/commit/819422bf16cd4bfc42e06c4245205b996217af1a))
* `FEAT`: use local bpmn-js dependency ([#13](https://github.com/pinussilvestrus/vs-code-bpmn-io/issues/13))
* `FEAT`: open preview panel to next column ([#6](https://github.com/pinussilvestrus/vs-code-bpmn-io/issues/6))

## 0.4.1

* `FIX`: set background-color to white ([#3](https://github.com/pinussilvestrus/vs-code-bpmn-io/issues/3))

## 0.4.0

* `CHORE`: dependency updates

## 0.3.0

* `FEAT`: Show Preview as action ([`1e5e6c`](https://github.com/pinussilvestrus/vs-code-bpmn-io/commit/1e5e6c37eba38745c6f01c2b7428e56078e865b5))
* `FEAT`: Refresh Preview on focus ([`84cf5fb`](https://github.com/pinussilvestrus/vs-code-bpmn-io/commit/84cf5fb131d71a75906f3adc7a43a879eac3f39a))
* `FEAT`: Zoom to fit full viewport ([`bab8df`](https://github.com/pinussilvestrus/vs-code-bpmn-io/commit/bab8dfd920d9cec229587d84032ec927d863af67))
* `CHORE`: Do not open Preview directly when workspace is loaded ([`d67ea8`](https://github.com/pinussilvestrus/vs-code-bpmn-io/commit/d67ea82735e952b271ff8ccb44ccf063da3e1865))

## 0.2.0

* Initial release
* `FEAT`: Add BPMN Viewer ([`197d34`](https://github.com/pinussilvestrus/vs-code-bpmn-io/commit/197d3465890c13e53b3391123b7fbda82d341415))
