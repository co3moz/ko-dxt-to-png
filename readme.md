# Knight Online DXT to PNG Converter

This application will transform your texture files (.dxt) to modern png files.

![](doc/a1r5g5b5.png)

## Install

- install node.js
- type in terminal `npm i ko-dxt-to-png -g`

## Usage

- type in terminal `ko-dxt-to-png file.dxt`
- there will be `file.png`

## Tips

You may change the output with `-o` or `--output`

```sh
ko-dxt-to-png -o ./test.png file.dxt
```

You can convert all .dxt files in cwd by using `-d` or `--directory`

```sh
cd ./some_folder_has_tons_of_dxts
ko-dxt-to-png -d
```

It will only work with cwd, I thought this will be safer, and .pngs wont be replicated if they already exist
